import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all candidates
    const candidates = await query('SELECT id, candidate_name, candidate_email, created_at FROM candidates ORDER BY created_at DESC');
    
    // Get all evaluations
    const evaluations = await query('SELECT id, candidate_id, verdict, created_at FROM evaluations ORDER BY created_at DESC');
    
    // Count unique candidates with evaluations
    const evalCandidateIds = evaluations.success && Array.isArray(evaluations.data)
      ? [...new Set(evaluations.data.map(e => e.candidate_id).filter(id => id != null))]
      : [];
    
    return res.status(200).json({
      success: true,
      summary: {
        totalCandidates: candidates.success ? (candidates.data?.length || 0) : 0,
        totalEvaluations: evaluations.success ? (evaluations.data?.length || 0) : 0,
        uniqueCandidatesWithEvaluations: evalCandidateIds.length,
      },
      candidates: candidates.success ? candidates.data : [],
      evaluations: evaluations.success ? evaluations.data : [],
      evaluationCandidateIds: evalCandidateIds,
    });
  } catch (error) {
    console.error('[candidates/test-simple] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

