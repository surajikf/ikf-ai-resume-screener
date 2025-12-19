import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get total candidates count
    const candidatesCount = await query('SELECT COUNT(*) as count FROM candidates');
    const totalCandidates = candidatesCount.success ? (candidatesCount.data?.[0]?.count || candidatesCount.data?.[0]?.total || 0) : 0;

    // Get all candidates with their IDs
    const allCandidates = await query('SELECT id, candidate_name, created_at FROM candidates ORDER BY id');
    const candidateList = allCandidates.success && Array.isArray(allCandidates.data) ? allCandidates.data : [];

    // Get evaluations count
    const evaluationsCount = await query('SELECT COUNT(*) as count FROM evaluations');
    const totalEvaluations = evaluationsCount.success ? (evaluationsCount.data?.[0]?.count || evaluationsCount.data?.[0]?.total || 0) : 0;

    // Get all evaluations first to check the data
    const allEvaluationsRaw = await query('SELECT id, candidate_id, verdict, created_at FROM evaluations ORDER BY created_at DESC');
    const allEvals = allEvaluationsRaw.success && Array.isArray(allEvaluationsRaw.data) ? allEvaluationsRaw.data : [];
    
    // Group evaluations by candidate_id in JavaScript (more reliable than SQL GROUP BY with subqueries)
    const evalStatsMap = {};
    allEvals.forEach(eval => {
      if (eval.candidate_id != null) {
        const candidateId = String(eval.candidate_id);
        if (!evalStatsMap[candidateId]) {
          evalStatsMap[candidateId] = {
            candidate_id: candidateId,
            eval_count: 0,
            latest_eval_date: null,
            latest_verdict: null,
            evaluations: [],
          };
        }
        evalStatsMap[candidateId].eval_count++;
        evalStatsMap[candidateId].evaluations.push({
          id: eval.id,
          verdict: eval.verdict,
          created_at: eval.created_at,
        });
      }
    });
    
    // Find latest evaluation for each candidate
    Object.values(evalStatsMap).forEach(stat => {
      if (stat.evaluations.length > 0) {
        stat.evaluations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        stat.latest_eval_date = stat.evaluations[0].created_at;
        stat.latest_verdict = stat.evaluations[0].verdict;
      }
    });
    
    const evalStats = Object.values(evalStatsMap);

    // Count candidates by verdict
    const verdictCounts = {
      Recommended: 0,
      'Partially Suitable': 0,
      'Not Suitable': 0,
      'No Evaluations': 0,
    };

    const candidateIdsWithEvals = new Set(evalStats.map(e => String(e.candidate_id)));
    
    candidateList.forEach(c => {
      const candidateId = String(c.id);
      if (candidateIdsWithEvals.has(candidateId)) {
        const evalStat = evalStats.find(e => String(e.candidate_id) === candidateId);
        const verdict = evalStat?.latest_verdict;
        if (verdict && verdictCounts.hasOwnProperty(verdict)) {
          verdictCounts[verdict]++;
        } else {
          verdictCounts['No Evaluations']++;
        }
      } else {
        verdictCounts['No Evaluations']++;
      }
    });

    // Get sample of candidates
    const sampleCandidates = candidateList.slice(0, 10).map(c => ({
      id: c.id,
      name: c.candidate_name,
      created_at: c.created_at,
    }));

    return res.status(200).json({
      success: true,
      summary: {
        totalCandidates,
        totalEvaluations,
        candidatesWithEvaluations: candidateIdsWithEvals.size,
        candidatesWithoutEvaluations: totalCandidates - candidateIdsWithEvals.size,
        verdictBreakdown: verdictCounts,
      },
      sampleCandidates,
      allCandidateIds: candidateList.map(c => c.id),
      evaluationStats: evalStats.slice(0, 10),
    });
  } catch (error) {
    console.error('[candidates/check-all] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

