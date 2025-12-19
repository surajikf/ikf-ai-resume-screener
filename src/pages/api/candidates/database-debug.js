import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[candidates/database-debug] ========== START ==========');
    console.log('[candidates/database-debug] Request method:', req.method);
    console.log('[candidates/database-debug] Request URL:', req.url);
    console.log('[candidates/database-debug] Request query:', req.query);

    // Test 1: Basic query
    console.log('[candidates/database-debug] Test 1: Basic COUNT query');
    const countResult = await query('SELECT COUNT(*) as count FROM candidates');
    console.log('[candidates/database-debug] Count result:', JSON.stringify(countResult, null, 2));

    if (!countResult || !countResult.success) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
        debug: { countResult },
      });
    }

    // Test 2: Get candidates
    console.log('[candidates/database-debug] Test 2: Get candidates');
    const candidatesResult = await query('SELECT id, candidate_name, candidate_email FROM candidates LIMIT 10');
    console.log('[candidates/database-debug] Candidates result:', {
      success: candidatesResult?.success,
      dataLength: candidatesResult?.data?.length || 0,
      error: candidatesResult?.error,
      sample: candidatesResult?.data?.[0],
    });

    if (!candidatesResult || !candidatesResult.success) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
        debug: { countResult, candidatesResult },
      });
    }

    const candidates = Array.isArray(candidatesResult.data) ? candidatesResult.data : [];
    console.log('[candidates/database-debug] Found', candidates.length, 'candidates');

    // Test 3: Get evaluations with IN clause
    if (candidates.length > 0) {
      const candidateIds = candidates.map(c => c.id).filter(id => id != null).slice(0, 5); // Limit to 5 for testing
      console.log('[candidates/database-debug] Test 3: Get evaluations for', candidateIds.length, 'candidates');
      console.log('[candidates/database-debug] Candidate IDs:', candidateIds);

      if (candidateIds.length > 0) {
        const placeholders = candidateIds.map(() => '?').join(',');
        const evalsSql = `SELECT candidate_id, id, verdict, created_at FROM evaluations WHERE candidate_id IN (${placeholders}) LIMIT 10`;
        console.log('[candidates/database-debug] Evaluations SQL:', evalsSql);
        console.log('[candidates/database-debug] Evaluations params:', candidateIds);

        const evalsResult = await query(evalsSql, candidateIds);
        console.log('[candidates/database-debug] Evaluations result:', {
          success: evalsResult?.success,
          dataLength: evalsResult?.data?.length || 0,
          error: evalsResult?.error,
          sample: evalsResult?.data?.[0],
        });
      }
    }

    // Format response
    const formatted = candidates.map(c => ({
      candidateId: String(c.id),
      candidateName: c.candidate_name || 'Unknown',
      candidateEmail: c.candidate_email,
      evaluations: [],
      totalEvaluations: 0,
      latestEvaluationDate: null,
      latestEvaluation: null,
    }));

    console.log('[candidates/database-debug] ========== SUCCESS ==========');
    return res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        total: formatted.length,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error('[candidates/database-debug] ========== ERROR ==========');
    console.error('[candidates/database-debug] Error name:', error.name);
    console.error('[candidates/database-debug] Error message:', error.message);
    console.error('[candidates/database-debug] Error stack:', error.stack);
    console.error('[candidates/database-debug] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('[candidates/database-debug] =============================');

    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      errorName: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

