import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all candidates
    const candidates = await query('SELECT id, candidate_name FROM candidates ORDER BY id');
    
    // Get evaluations for each candidate
    const candidateEvalCounts = {};
    
    if (candidates.success && Array.isArray(candidates.data)) {
      for (const candidate of candidates.data) {
        const evalCount = await query(
          'SELECT COUNT(*) as count FROM evaluations WHERE candidate_id = ?',
          [candidate.id]
        );
        
        candidateEvalCounts[candidate.id] = {
          name: candidate.candidate_name,
          count: evalCount.success ? (evalCount.data?.[0]?.count || evalCount.data?.[0]?.total || 0) : 0,
        };
      }
    }
    
    // Get the 2 most recent evaluations and their candidate_ids
    const recentEvals = await query(`
      SELECT id, candidate_id, created_at 
      FROM evaluations 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    return res.status(200).json({
      success: true,
      candidateEvaluationCounts: candidateEvalCounts,
      recentEvaluations: recentEvals.success ? recentEvals.data : [],
      summary: {
        totalCandidates: candidates.success ? candidates.data?.length : 0,
        candidates: candidates.success ? candidates.data : [],
      },
    });
  } catch (error) {
    console.error('[candidates/verify-fix] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

