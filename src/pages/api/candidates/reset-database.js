import { query, getConnection } from '@/lib/db';
import { supabase } from '@/lib/db-supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // For GET requests, show what will be deleted
  if (req.method === 'GET') {
    try {
      const candidatesCount = await query('SELECT COUNT(*) as count FROM candidates');
      const evaluationsCount = await query('SELECT COUNT(*) as count FROM evaluations');
      const resumesCount = await query('SELECT COUNT(*) as count FROM resumes');
      const emailLogsCount = await query('SELECT COUNT(*) as count FROM email_logs');
      const whatsappLogsCount = await query('SELECT COUNT(*) as count FROM whatsapp_logs');
      
      return res.status(200).json({
        message: 'This will DELETE ALL candidates, evaluations, resumes, email logs, and WhatsApp logs from the database.',
        warning: 'This action cannot be undone!',
        currentData: {
          candidates: candidatesCount.success ? (candidatesCount.data?.[0]?.count || candidatesCount.data?.[0]?.total || 0) : 0,
          evaluations: evaluationsCount.success ? (evaluationsCount.data?.[0]?.count || evaluationsCount.data?.[0]?.total || 0) : 0,
          resumes: resumesCount.success ? (resumesCount.data?.[0]?.count || resumesCount.data?.[0]?.total || 0) : 0,
          emailLogs: emailLogsCount.success ? (emailLogsCount.data?.[0]?.count || emailLogsCount.data?.[0]?.total || 0) : 0,
          whatsappLogs: whatsappLogsCount.success ? (whatsappLogsCount.data?.[0]?.count || whatsappLogsCount.data?.[0]?.total || 0) : 0,
        },
        instructions: 'To proceed, send a POST request to this endpoint with { "confirm": true }',
        note: 'After deletion, candidate IDs will start from 1 for new candidates.',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // POST request or GET with confirm=true - actually delete
  try {
    const confirm = req.method === 'POST' ? req.body?.confirm : req.query.confirm === 'true';
    
    if (confirm !== true) {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required. For GET: add ?confirm=true to URL. For POST: send { "confirm": true } in body.',
      });
    }

    console.log('[candidates/reset-database] ========== STARTING DATABASE RESET ==========');
    
    // Use query function directly for better Supabase compatibility
    try {
      // Get counts before deletion
      const candidatesCountResult = await query('SELECT COUNT(*) as count FROM candidates');
      const evaluationsCountResult = await query('SELECT COUNT(*) as count FROM evaluations');
      const resumesCountResult = await query('SELECT COUNT(*) as count FROM resumes');
      const emailLogsCountResult = await query('SELECT COUNT(*) as count FROM email_logs');
      const whatsappLogsCountResult = await query('SELECT COUNT(*) as count FROM whatsapp_logs');
      
      const countsBefore = {
        candidates: candidatesCountResult.success ? (candidatesCountResult.data?.[0]?.count || candidatesCountResult.data?.[0]?.total || 0) : 0,
        evaluations: evaluationsCountResult.success ? (evaluationsCountResult.data?.[0]?.count || evaluationsCountResult.data?.[0]?.total || 0) : 0,
        resumes: resumesCountResult.success ? (resumesCountResult.data?.[0]?.count || resumesCountResult.data?.[0]?.total || 0) : 0,
        emailLogs: emailLogsCountResult.success ? (emailLogsCountResult.data?.[0]?.count || emailLogsCountResult.data?.[0]?.total || 0) : 0,
        whatsappLogs: whatsappLogsCountResult.success ? (whatsappLogsCountResult.data?.[0]?.count || whatsappLogsCountResult.data?.[0]?.total || 0) : 0,
      };
      
      console.log('[candidates/reset-database] Current data:', countsBefore);

      // Delete in order (respecting foreign key constraints)
      // Use query function for better Supabase compatibility
      // 1. Delete email_logs and whatsapp_logs first (they reference evaluations)
      console.log('[candidates/reset-database] Deleting email_logs...');
      const deleteEmailLogsResult = await query('DELETE FROM email_logs');
      console.log('[candidates/reset-database] Delete email_logs result:', deleteEmailLogsResult);
      
      console.log('[candidates/reset-database] Deleting whatsapp_logs...');
      const deleteWhatsappLogsResult = await query('DELETE FROM whatsapp_logs');
      console.log('[candidates/reset-database] Delete whatsapp_logs result:', deleteWhatsappLogsResult);
      
      // 2. Delete resumes (they reference evaluations)
      console.log('[candidates/reset-database] Deleting resumes...');
      const deleteResumesResult = await query('DELETE FROM resumes');
      console.log('[candidates/reset-database] Delete resumes result:', deleteResumesResult);
      
      // 3. Delete evaluations (they reference candidates)
      console.log('[candidates/reset-database] Deleting evaluations...');
      const deleteEvalsResult = await query('DELETE FROM evaluations');
      console.log('[candidates/reset-database] Delete evaluations result:', deleteEvalsResult);
      
      // 4. Delete candidates
      console.log('[candidates/reset-database] Deleting candidates...');
      const deleteCandidatesResult = await query('DELETE FROM candidates');
      console.log('[candidates/reset-database] Delete candidates result:', deleteCandidatesResult);
      
      // 5. Reset auto-increment/sequences
      const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
      if (!useSupabase) {
        // MySQL: Reset AUTO_INCREMENT
        try {
          console.log('[candidates/reset-database] Resetting auto-increment for MySQL...');
          const connection = await getConnection();
          await connection.execute('ALTER TABLE candidates AUTO_INCREMENT = 1');
          await connection.execute('ALTER TABLE evaluations AUTO_INCREMENT = 1');
          await connection.execute('ALTER TABLE resumes AUTO_INCREMENT = 1');
          await connection.execute('ALTER TABLE email_logs AUTO_INCREMENT = 1');
          await connection.execute('ALTER TABLE whatsapp_logs AUTO_INCREMENT = 1');
          await connection.release();
          console.log('[candidates/reset-database] ✅ MySQL auto-increment reset successfully');
        } catch (resetError) {
          console.warn('[candidates/reset-database] Could not reset auto-increment (may not be MySQL):', resetError.message);
        }
      } else {
        // Supabase/PostgreSQL: Reset sequences explicitly
        // Note: Supabase JS client doesn't support DDL statements directly
        // We need to use setval() which should work through the query wrapper
        try {
          console.log('[candidates/reset-database] Resetting sequences for Supabase/PostgreSQL...');
          
          // Use setval with is_called = false to reset to exact value
          // setval(sequence_name, value, is_called) - if is_called=false, next value will be exactly 'value'
          const sequences = [
            'candidates_id_seq',
            'evaluations_id_seq',
            'resumes_id_seq',
            'email_logs_id_seq',
            'whatsapp_logs_id_seq'
          ];
          
          for (const seqName of sequences) {
            try {
              // Method 1: Use setval with is_called=false (next value will be exactly 1)
              const setvalResult = await query(`SELECT setval('${seqName}', 1, false)`);
              console.log(`[candidates/reset-database] Reset ${seqName} using setval:`, setvalResult);
              
              // Verify the reset worked by checking the sequence
              if (setvalResult.success) {
                console.log(`[candidates/reset-database] ✅ ${seqName} reset successfully`);
              } else {
                throw new Error(`setval failed: ${setvalResult.error}`);
              }
            } catch (e) {
              console.warn(`[candidates/reset-database] Could not reset ${seqName} using setval:`, e.message);
              
              // Method 2: Try ALTER SEQUENCE RESTART
              try {
                const alterResult = await query(`ALTER SEQUENCE ${seqName} RESTART WITH 1`);
                console.log(`[candidates/reset-database] Reset ${seqName} using ALTER SEQUENCE:`, alterResult);
              } catch (alterError) {
                console.warn(`[candidates/reset-database] Could not reset ${seqName} using ALTER SEQUENCE:`, alterError.message);
                // Method 3: Try setval with is_called=true (next value will be 2, so we set to 0)
                try {
                  await query(`SELECT setval('${seqName}', 0, true)`);
                  console.log(`[candidates/reset-database] Reset ${seqName} using setval(0, true)`);
                } catch (setval0Error) {
                  console.error(`[candidates/reset-database] All methods failed for ${seqName}:`, setval0Error.message);
                }
              }
            }
          }
          
          console.log('[candidates/reset-database] ✅ Sequence reset attempts completed');
          console.log('[candidates/reset-database] ⚠️  Please verify sequences in Supabase SQL Editor if next ID is not 1');
        } catch (seqError) {
          console.error('[candidates/reset-database] Error resetting sequences:', seqError);
          console.warn('[candidates/reset-database] ⚠️  Sequences may need to be reset manually in Supabase SQL Editor');
          console.warn('[candidates/reset-database] Run this SQL in Supabase SQL Editor:');
          console.warn('  SELECT setval(\'candidates_id_seq\', 1, false);');
          console.warn('  SELECT setval(\'evaluations_id_seq\', 1, false);');
          console.warn('  SELECT setval(\'resumes_id_seq\', 1, false);');
        }
      }
      
      // Verify deletion
      const verifyCandidates = await query('SELECT COUNT(*) as count FROM candidates');
      const verifyEvaluations = await query('SELECT COUNT(*) as count FROM evaluations');
      const verifyResumes = await query('SELECT COUNT(*) as count FROM resumes');
      const verifyEmailLogs = await query('SELECT COUNT(*) as count FROM email_logs');
      const verifyWhatsappLogs = await query('SELECT COUNT(*) as count FROM whatsapp_logs');
      
      const countsAfter = {
        candidates: verifyCandidates.success ? (verifyCandidates.data?.[0]?.count || verifyCandidates.data?.[0]?.total || 0) : -1,
        evaluations: verifyEvaluations.success ? (verifyEvaluations.data?.[0]?.count || verifyEvaluations.data?.[0]?.total || 0) : -1,
        resumes: verifyResumes.success ? (verifyResumes.data?.[0]?.count || verifyResumes.data?.[0]?.total || 0) : -1,
        emailLogs: verifyEmailLogs.success ? (verifyEmailLogs.data?.[0]?.count || verifyEmailLogs.data?.[0]?.total || 0) : -1,
        whatsappLogs: verifyWhatsappLogs.success ? (verifyWhatsappLogs.data?.[0]?.count || verifyWhatsappLogs.data?.[0]?.total || 0) : -1,
      };
      
      console.log('[candidates/reset-database] ========== DATABASE RESET COMPLETE ==========');
      console.log('[candidates/reset-database] Deleted:', countsBefore);
      console.log('[candidates/reset-database] Remaining:', countsAfter);

      return res.status(200).json({
        success: true,
        message: 'Database reset successfully',
        deleted: countsBefore,
        remaining: countsAfter,
        note: 'All candidates, evaluations, resumes, email logs, and WhatsApp logs have been deleted. New candidates will start with ID 1.',
      });
    } catch (innerError) {
      console.error('[candidates/reset-database] Error during deletion:', innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('[candidates/reset-database] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

