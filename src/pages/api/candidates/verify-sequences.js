import { query } from '@/lib/db';
import { supabase } from '@/lib/db-supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
    
    if (useSupabase) {
      // Check PostgreSQL sequences using Supabase RPC or direct SQL
      const sequences = [
        'candidates_id_seq',
        'evaluations_id_seq',
        'resumes_id_seq',
        'email_logs_id_seq',
        'whatsapp_logs_id_seq'
      ];
      
      const sequenceValues = {};
      
      for (const seqName of sequences) {
        try {
          // Use Supabase RPC to call a function that queries the sequence
          // Or use raw SQL through Supabase
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: `SELECT last_value, is_called FROM ${seqName}`
          });
          
          if (!error && data && data.length > 0) {
            const seq = data[0];
            const nextValue = seq.is_called ? parseInt(seq.last_value) + 1 : parseInt(seq.last_value);
            sequenceValues[seqName] = {
              lastValue: parseInt(seq.last_value),
              isCalled: seq.is_called,
              nextValue: nextValue
            };
          } else {
            // Try alternative: check if we can get max ID from table (if empty, next will be 1)
            const tableName = seqName.replace('_id_seq', '');
            const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
            const maxIdResult = await query(`SELECT MAX(id) as max_id FROM ${tableName}`);
            
            const count = countResult.success ? (countResult.data?.[0]?.count || countResult.data?.[0]?.total || 0) : 0;
            const maxId = maxIdResult.success ? (maxIdResult.data?.[0]?.max_id || null) : null;
            
            // If table is empty, next ID should be 1
            // If table has data, next ID would be maxId + 1
            const nextValue = count === 0 ? 1 : (maxId ? parseInt(maxId) + 1 : 1);
            
            sequenceValues[seqName] = {
              inferred: true,
              tableCount: count,
              maxId: maxId,
              nextValue: nextValue,
              note: count === 0 ? 'Table is empty, next ID will be 1' : `Table has ${count} records, next ID will be ${nextValue}`
            };
          }
        } catch (e) {
          // Fallback: check table directly
          try {
            const tableName = seqName.replace('_id_seq', '');
            const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
            const maxIdResult = await query(`SELECT MAX(id) as max_id FROM ${tableName}`);
            
            const count = countResult.success ? (countResult.data?.[0]?.count || countResult.data?.[0]?.total || 0) : 0;
            const maxId = maxIdResult.success ? (maxIdResult.data?.[0]?.max_id || null) : null;
            const nextValue = count === 0 ? 1 : (maxId ? parseInt(maxId) + 1 : 1);
            
            sequenceValues[seqName] = {
              inferred: true,
              tableCount: count,
              maxId: maxId,
              nextValue: nextValue,
              note: count === 0 ? 'Table is empty, next ID will be 1' : `Table has ${count} records, next ID will be ${nextValue}`
            };
          } catch (e2) {
            sequenceValues[seqName] = { error: e.message };
          }
        }
      }
      
      // Also check actual table counts
      const candidatesCount = await query('SELECT COUNT(*) as count FROM candidates');
      const evaluationsCount = await query('SELECT COUNT(*) as count FROM evaluations');
      const resumesCount = await query('SELECT COUNT(*) as count FROM resumes');
      
      return res.status(200).json({
        success: true,
        databaseType: 'Supabase/PostgreSQL',
        sequences: sequenceValues,
        tableCounts: {
          candidates: candidatesCount.success ? (candidatesCount.data?.[0]?.count || candidatesCount.data?.[0]?.total || 0) : 0,
          evaluations: evaluationsCount.success ? (evaluationsCount.data?.[0]?.count || evaluationsCount.data?.[0]?.total || 0) : 0,
          resumes: resumesCount.success ? (resumesCount.data?.[0]?.count || resumesCount.data?.[0]?.total || 0) : 0,
        },
        note: 'If nextValue is 1, the next insert will have ID 1. If nextValue > 1, you may need to reset the sequence.'
      });
    } else {
      // MySQL - check AUTO_INCREMENT values
      const tables = ['candidates', 'evaluations', 'resumes', 'email_logs', 'whatsapp_logs'];
      const autoIncrementValues = {};
      
      for (const table of tables) {
        try {
          const result = await query(`SHOW TABLE STATUS LIKE ?`, [table]);
          if (result.success && result.data && result.data.length > 0) {
            autoIncrementValues[table] = {
              autoIncrement: result.data[0].Auto_increment || result.data[0].AUTO_INCREMENT || null
            };
          }
        } catch (e) {
          autoIncrementValues[table] = { error: e.message };
        }
      }
      
      // Also check actual table counts
      const candidatesCount = await query('SELECT COUNT(*) as count FROM candidates');
      const evaluationsCount = await query('SELECT COUNT(*) as count FROM evaluations');
      const resumesCount = await query('SELECT COUNT(*) as count FROM resumes');
      
      return res.status(200).json({
        success: true,
        databaseType: 'MySQL',
        autoIncrement: autoIncrementValues,
        tableCounts: {
          candidates: candidatesCount.success ? (candidatesCount.data?.[0]?.count || candidatesCount.data?.[0]?.total || 0) : 0,
          evaluations: evaluationsCount.success ? (evaluationsCount.data?.[0]?.count || evaluationsCount.data?.[0]?.total || 0) : 0,
          resumes: resumesCount.success ? (resumesCount.data?.[0]?.count || resumesCount.data?.[0]?.total || 0) : 0,
        },
        note: 'If autoIncrement is 1, the next insert will have ID 1. If autoIncrement > 1, you may need to reset it.'
      });
    }
  } catch (error) {
    console.error('[verify-sequences] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
