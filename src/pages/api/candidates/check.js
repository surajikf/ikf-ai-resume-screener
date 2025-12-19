import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[candidates/check] ========== DIAGNOSTIC CHECK ==========');
    
    // Check 1: Count candidates
    const countResult = await query('SELECT COUNT(*) as count FROM candidates');
    console.log('[candidates/check] Count result:', JSON.stringify(countResult, null, 2));
    
    // Check 2: Get all candidates with IDs
    const allCandidates = await query('SELECT id, candidate_name, candidate_email, created_at FROM candidates ORDER BY created_at DESC LIMIT 20');
    console.log('[candidates/check] All candidates result:', JSON.stringify(allCandidates, null, 2));
    
    // Check 3: Get recent evaluations (simplified to avoid JOIN issues)
    const recentEvals = await query('SELECT id, candidate_id, verdict, created_at FROM evaluations ORDER BY created_at DESC LIMIT 10');
    console.log('[candidates/check] Recent evaluations result:', JSON.stringify(recentEvals, null, 2));
    
    // Check 4: Get all evaluations with candidate info (fetch separately to avoid JOIN)
    const allEvals = await query('SELECT id, candidate_id, verdict, created_at FROM evaluations ORDER BY created_at DESC');
    const evalCandidateIds = allEvals.success && Array.isArray(allEvals.data) 
      ? [...new Set(allEvals.data.map(e => e.candidate_id).filter(id => id != null))]
      : [];
    console.log('[candidates/check] Unique candidate IDs with evaluations:', evalCandidateIds);
    
    // Check 5: Get candidate IDs from candidates table
    const allCandidateIds = allCandidates.success && Array.isArray(allCandidates.data)
      ? allCandidates.data.map(c => c.id).filter(id => id != null)
      : [];
    console.log('[candidates/check] All candidate IDs in database:', allCandidateIds);
    
    // Check 6: Find candidates without evaluations (in JavaScript to avoid NOT EXISTS)
    const candidatesWithoutEvals = allCandidates.success && Array.isArray(allCandidates.data)
      ? allCandidates.data.filter(c => !evalCandidateIds.includes(c.id))
      : [];
    console.log('[candidates/check] Candidates without evaluations (calculated):', candidatesWithoutEvals);
    
    return res.status(200).json({
      success: true,
      diagnostics: {
        candidateCount: {
          result: countResult,
          count: countResult.success ? (countResult.data?.[0]?.count || countResult.data?.[0]?.total || 0) : 0,
        },
        allCandidates: {
          result: allCandidates,
          count: allCandidates.success ? (allCandidates.data?.length || 0) : 0,
          data: allCandidates.success ? allCandidates.data : [],
        },
        recentEvaluations: {
          result: recentEvals,
          count: recentEvals.success ? (recentEvals.data?.length || 0) : 0,
          data: recentEvals.success ? recentEvals.data : [],
        },
        candidatesWithoutEvaluations: {
          count: Array.isArray(candidatesWithoutEvals) ? candidatesWithoutEvals.length : 0,
          data: Array.isArray(candidatesWithoutEvals) ? candidatesWithoutEvals : [],
        },
        evaluationStats: {
          totalEvaluations: allEvals.success ? (allEvals.data?.length || 0) : 0,
          uniqueCandidatesWithEvals: evalCandidateIds.length,
          allCandidateIds: allCandidateIds,
          evalCandidateIds: evalCandidateIds,
        },
      },
    });
  } catch (error) {
    console.error('[candidates/check] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

