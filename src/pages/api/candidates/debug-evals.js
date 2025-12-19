import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all evaluations with their candidate_id
    const allEvaluations = await query('SELECT id, candidate_id, verdict, created_at FROM evaluations ORDER BY created_at DESC');
    const evaluations = allEvaluations.success && Array.isArray(allEvaluations.data) ? allEvaluations.data : [];

    // Get all candidates
    const allCandidates = await query('SELECT id, candidate_name FROM candidates ORDER BY id');
    const candidates = allCandidates.success && Array.isArray(allCandidates.data) ? allCandidates.data : [];

    // Check for type mismatches
    const candidateIds = candidates.map(c => ({
      id: c.id,
      idType: typeof c.id,
      idString: String(c.id),
      name: c.candidate_name,
    }));

    const evaluationCandidateIds = evaluations.map(e => ({
      evalId: e.id,
      candidateId: e.candidate_id,
      candidateIdType: typeof e.candidate_id,
      candidateIdString: String(e.candidate_id),
      verdict: e.verdict,
    }));

    // Try to match them
    const matches = evaluations.map(evaluation => {
      const candidateId = evaluation.candidate_id;
      const candidate = candidates.find(c => 
        String(c.id) === String(candidateId) || 
        c.id === candidateId ||
        String(c.id) === String(candidateId)
      );
      return {
        evaluationId: evaluation.id,
        evaluationCandidateId: evaluation.candidate_id,
        evaluationCandidateIdType: typeof evaluation.candidate_id,
        matchedCandidate: candidate ? {
          id: candidate.id,
          name: candidate.candidate_name,
        } : null,
        verdict: evaluation.verdict,
      };
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalEvaluations: evaluations.length,
        totalCandidates: candidates.length,
        evaluationsWithNullCandidateId: evaluations.filter(e => e.candidate_id == null).length,
        evaluationsWithCandidateId: evaluations.filter(e => e.candidate_id != null).length,
      },
      candidates: candidateIds,
      evaluations: evaluationCandidateIds,
      matches,
      rawEvaluations: evaluations,
      rawCandidates: candidates,
    });
  } catch (error) {
    console.error('[candidates/debug-evals] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

