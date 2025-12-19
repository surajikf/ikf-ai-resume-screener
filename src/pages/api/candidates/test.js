import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test 1: Count candidates
    const countResult = await query('SELECT COUNT(*) as count FROM candidates');
    console.log('[test] Count result:', countResult);

    // Test 2: Get first 5 candidates
    const candidatesResult = await query('SELECT id, candidate_name, candidate_email FROM candidates LIMIT 5');
    console.log('[test] Candidates result:', candidatesResult);

    // Test 3: Count evaluations
    const evalCountResult = await query('SELECT COUNT(*) as count FROM evaluations');
    console.log('[test] Evaluations count:', evalCountResult);

    // Test 4: Get first 5 evaluations with candidate_id
    const evalsResult = await query(`
      SELECT e.id, e.candidate_id, e.verdict, c.candidate_name 
      FROM evaluations e 
      LEFT JOIN candidates c ON e.candidate_id = c.id 
      LIMIT 5
    `);
    console.log('[test] Evaluations result:', evalsResult);

    return res.status(200).json({
      success: true,
      data: {
        candidateCount: countResult.success ? countResult.data?.[0]?.count : 'error',
        candidates: candidatesResult.success ? candidatesResult.data : [],
        evaluationCount: evalCountResult.success ? evalCountResult.data?.[0]?.count : 'error',
        evaluations: evalsResult.success ? evalsResult.data : [],
        rawResults: {
          countResult,
          candidatesResult,
          evalCountResult,
          evalsResult,
        },
      },
    });
  } catch (error) {
    console.error('[test] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

