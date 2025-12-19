import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const confirm = req.method === 'POST' ? req.body?.confirm : req.query.confirm === 'true';
    
    if (confirm !== true) {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required. Send POST with { "confirm": true } or GET with ?confirm=true',
      });
    }

    const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
    
    if (!useSupabase) {
      return res.status(400).json({
        success: false,
        error: 'This endpoint is for Supabase/PostgreSQL only. MySQL uses AUTO_INCREMENT which is reset automatically.',
      });
    }

    console.log('[candidates/reset-sequences] ========== STARTING SEQUENCE RESET ==========');
    
    const sequences = [
      'candidates_id_seq',
      'evaluations_id_seq',
      'resumes_id_seq',
      'email_logs_id_seq',
      'whatsapp_logs_id_seq'
    ];
    
    const results = {};
    
    for (const seqName of sequences) {
      try {
        // Use setval with is_called=false to reset to exact value
        // This means the next value will be exactly 1
        const result = await query(`SELECT setval('${seqName}', 1, false)`);
        
        if (result.success) {
          // The result should contain the new sequence value
          results[seqName] = {
            success: true,
            message: 'Sequence reset successfully',
            nextValue: 1
          };
          console.log(`[candidates/reset-sequences] ✅ ${seqName} reset to 1`);
        } else {
          results[seqName] = {
            success: false,
            error: result.error || 'Unknown error'
          };
          console.error(`[candidates/reset-sequences] ❌ Failed to reset ${seqName}:`, result.error);
        }
      } catch (e) {
        results[seqName] = {
          success: false,
          error: e.message
        };
        console.error(`[candidates/reset-sequences] ❌ Error resetting ${seqName}:`, e.message);
      }
    }
    
    // Verify by checking sequence values
    const verification = {};
    for (const seqName of sequences) {
      try {
        // Check current sequence value
        const checkResult = await query(`SELECT last_value, is_called FROM ${seqName}`);
        if (checkResult.success && checkResult.data && checkResult.data.length > 0) {
          const seq = checkResult.data[0];
          const nextValue = seq.is_called ? parseInt(seq.last_value) + 1 : parseInt(seq.last_value);
          verification[seqName] = {
            lastValue: parseInt(seq.last_value),
            isCalled: seq.is_called,
            nextValue: nextValue,
            resetSuccessful: nextValue === 1
          };
        } else {
          verification[seqName] = {
            error: 'Could not verify sequence value'
          };
        }
      } catch (e) {
        verification[seqName] = {
          error: e.message
        };
      }
    }
    
    const allSuccessful = Object.values(results).every(r => r.success === true);
    const allVerified = Object.values(verification).every(v => v.resetSuccessful === true);
    
    console.log('[candidates/reset-sequences] ========== SEQUENCE RESET COMPLETE ==========');
    
    return res.status(200).json({
      success: allSuccessful,
      message: allVerified 
        ? 'All sequences reset successfully. Next IDs will start from 1.'
        : 'Sequence reset attempted. Please verify in Supabase SQL Editor.',
      results: results,
      verification: verification,
      note: allVerified 
        ? '✅ All sequences verified - next IDs will be 1'
        : '⚠️ Some sequences may need manual reset. Run this SQL in Supabase SQL Editor:\n' +
          sequences.map(s => `SELECT setval('${s}', 1, false);`).join('\n')
    });
  } catch (error) {
    console.error('[candidates/reset-sequences] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
