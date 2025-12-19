import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all candidates
    const allCandidates = await query('SELECT id, candidate_name, created_at FROM candidates ORDER BY id');
    const candidates = allCandidates.success && Array.isArray(allCandidates.data) ? allCandidates.data : [];

    // Get all evaluations
    const allEvaluations = await query('SELECT id, candidate_id, verdict, created_at FROM evaluations ORDER BY created_at DESC');
    const evaluations = allEvaluations.success && Array.isArray(allEvaluations.data) ? allEvaluations.data : [];

    // Find evaluations with candidate_id that don't match any candidate
    const candidateIds = new Set(candidates.map(c => String(c.id)));
    const orphanedEvaluations = evaluations.filter(e => {
      if (e.candidate_id == null) return true; // NULL candidate_id
      return !candidateIds.has(String(e.candidate_id)); // candidate_id doesn't match any candidate
    });

    // Find evaluations that are linked to candidates
    const linkedEvaluations = evaluations.filter(e => {
      if (e.candidate_id == null) return false;
      return candidateIds.has(String(e.candidate_id));
    });

    // Group evaluations by candidate_id to see distribution
    const evaluationsByCandidate = {};
    evaluations.forEach(e => {
      const candidateId = e.candidate_id != null ? String(e.candidate_id) : 'NULL';
      if (!evaluationsByCandidate[candidateId]) {
        evaluationsByCandidate[candidateId] = [];
      }
      evaluationsByCandidate[candidateId].push(e);
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalCandidates: candidates.length,
        totalEvaluations: evaluations.length,
        linkedEvaluations: linkedEvaluations.length,
        orphanedEvaluations: orphanedEvaluations.length,
        evaluationsWithNullCandidateId: evaluations.filter(e => e.candidate_id == null).length,
      },
      candidates: candidates.map(c => ({
        id: c.id,
        name: c.candidate_name,
        created_at: c.created_at,
        evaluationCount: evaluations.filter(e => e.candidate_id != null && String(e.candidate_id) === String(c.id)).length,
      })),
      orphanedEvaluations: orphanedEvaluations.map(e => ({
        id: e.id,
        candidate_id: e.candidate_id,
        verdict: e.verdict,
        created_at: e.created_at,
      })),
      evaluationsByCandidate: Object.entries(evaluationsByCandidate).map(([candidateId, evals]) => ({
        candidateId: candidateId === 'NULL' ? null : parseInt(candidateId),
        evaluationCount: evals.length,
        evaluations: evals.map(e => ({
          id: e.id,
          verdict: e.verdict,
          created_at: e.created_at,
        })),
      })),
    });
  } catch (error) {
    console.error('[candidates/check-missing] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

