import { query } from '@/lib/db';

/**
 * DANGEROUS OPERATION: Deletes ALL candidates and evaluations from the database
 * This will also delete related data:
 * - All evaluations
 * - All email logs
 * - All WhatsApp logs
 * - All resumes
 * - All candidate stages
 * 
 * Use with extreme caution!
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const { confirm } = req.body;

  // Require explicit confirmation
  if (confirm !== 'DELETE_ALL_DATA') {
    return res.status(400).json({
      success: false,
      error: 'Confirmation required. Send { "confirm": "DELETE_ALL_DATA" } in the request body.',
    });
  }

  try {
    const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
    
    // Get counts before deletion for reporting
    const counts = {
      candidates: 0,
      evaluations: 0,
      emailLogs: 0,
      whatsappLogs: 0,
      resumes: 0,
      candidateStages: 0,
    };

    try {
      const candidateCount = await query('SELECT COUNT(*) as count FROM candidates', []);
      counts.candidates = candidateCount.success ? (candidateCount.data[0]?.count || 0) : 0;

      const evaluationCount = await query('SELECT COUNT(*) as count FROM evaluations', []);
      counts.evaluations = evaluationCount.success ? (evaluationCount.data[0]?.count || 0) : 0;

      const emailLogCount = await query('SELECT COUNT(*) as count FROM email_logs', []);
      counts.emailLogs = emailLogCount.success ? (emailLogCount.data[0]?.count || 0) : 0;

      const whatsappLogCount = await query('SELECT COUNT(*) as count FROM whatsapp_logs', []);
      counts.whatsappLogs = whatsappLogCount.success ? (whatsappLogCount.data[0]?.count || 0) : 0;

      const resumeCount = await query('SELECT COUNT(*) as count FROM resumes', []);
      counts.resumes = resumeCount.success ? (resumeCount.data[0]?.count || 0) : 0;

      const stageCount = await query('SELECT COUNT(*) as count FROM candidate_stages', []);
      counts.candidateStages = stageCount.success ? (stageCount.data[0]?.count || 0) : 0;
    } catch (err) {
      console.warn('Error getting counts (some tables may not exist):', err.message);
    }

    // Delete in correct order to respect foreign key constraints
    // Order: child tables first, then parent tables

    const deletionResults = {
      emailLogs: { success: false, error: null },
      whatsappLogs: { success: false, error: null },
      resumes: { success: false, error: null },
      candidateStages: { success: false, error: null },
      evaluations: { success: false, error: null },
      candidates: { success: false, error: null },
    };

    // 1. Delete email logs
    try {
      const result = await query('DELETE FROM email_logs', []);
      deletionResults.emailLogs.success = result.success;
      deletionResults.emailLogs.error = result.error;
    } catch (err) {
      deletionResults.emailLogs.error = err.message;
      console.warn('Error deleting email_logs:', err.message);
    }

    // 2. Delete WhatsApp logs
    try {
      const result = await query('DELETE FROM whatsapp_logs', []);
      deletionResults.whatsappLogs.success = result.success;
      deletionResults.whatsappLogs.error = result.error;
    } catch (err) {
      deletionResults.whatsappLogs.error = err.message;
      console.warn('Error deleting whatsapp_logs:', err.message);
    }

    // 3. Delete resumes
    try {
      const result = await query('DELETE FROM resumes', []);
      deletionResults.resumes.success = result.success;
      deletionResults.resumes.error = result.error;
    } catch (err) {
      deletionResults.resumes.error = err.message;
      console.warn('Error deleting resumes:', err.message);
    }

    // 4. Delete candidate stages
    try {
      const result = await query('DELETE FROM candidate_stages', []);
      deletionResults.candidateStages.success = result.success;
      deletionResults.candidateStages.error = result.error;
    } catch (err) {
      deletionResults.candidateStages.error = err.message;
      console.warn('Error deleting candidate_stages:', err.message);
    }

    // 5. Delete evaluations (references candidates)
    try {
      const result = await query('DELETE FROM evaluations', []);
      deletionResults.evaluations.success = result.success;
      deletionResults.evaluations.error = result.error;
    } catch (err) {
      deletionResults.evaluations.error = err.message;
      console.error('Error deleting evaluations:', err.message);
      return res.status(500).json({
        success: false,
        error: `Failed to delete evaluations: ${err.message}`,
        partialResults: deletionResults,
      });
    }

    // 6. Delete candidates (parent table)
    try {
      const result = await query('DELETE FROM candidates', []);
      deletionResults.candidates.success = result.success;
      deletionResults.candidates.error = result.error;
    } catch (err) {
      deletionResults.candidates.error = err.message;
      console.error('Error deleting candidates:', err.message);
      return res.status(500).json({
        success: false,
        error: `Failed to delete candidates: ${err.message}`,
        partialResults: deletionResults,
      });
    }

    // Verify deletion
    const verifyCandidateCount = await query('SELECT COUNT(*) as count FROM candidates', []);
    const verifyEvaluationCount = await query('SELECT COUNT(*) as count FROM evaluations', []);

    const allDeleted = 
      verifyCandidateCount.success && verifyCandidateCount.data[0]?.count === 0 &&
      verifyEvaluationCount.success && verifyEvaluationCount.data[0]?.count === 0;

    return res.status(200).json({
      success: allDeleted,
      message: allDeleted 
        ? 'All candidates and evaluations deleted successfully'
        : 'Deletion completed but verification shows some records may remain',
      deletedCounts: counts,
      deletionResults,
      verification: {
        candidatesRemaining: verifyCandidateCount.success ? verifyCandidateCount.data[0]?.count : 'unknown',
        evaluationsRemaining: verifyEvaluationCount.success ? verifyEvaluationCount.data[0]?.count : 'unknown',
      },
    });
  } catch (error) {
    console.error('Error deleting all data:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete all data',
    });
  }
}

