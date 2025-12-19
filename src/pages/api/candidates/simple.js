import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[candidates/simple] Starting simple test...');
    
    // Test 1: Simple count
    const countResult = await query('SELECT COUNT(*) as count FROM candidates');
    console.log('[candidates/simple] Count result:', countResult);
    
    // Test 2: Get all candidates (simple)
    const allResult = await query('SELECT id, candidate_name FROM candidates LIMIT 10');
    console.log('[candidates/simple] All candidates result:', allResult);
    
    return res.status(200).json({
      success: true,
      count: countResult.success ? countResult.data?.[0]?.count : 'error',
      candidates: allResult.success ? allResult.data : [],
      rawCount: countResult,
      rawCandidates: allResult,
    });
  } catch (error) {
    console.error('[candidates/simple] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}

