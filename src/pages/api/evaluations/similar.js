import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { candidateId, roleApplied, limit = 5 } = req.query;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'Candidate ID is required',
      });
    }

    // Find similar candidates based on role and score
    let sql = `
      SELECT 
        e.id,
        e.role_applied,
        e.match_score,
        e.verdict,
        e.created_at,
        c.candidate_name,
        c.candidate_location
      FROM evaluations e
      INNER JOIN candidates c ON e.candidate_id = c.id
      WHERE e.candidate_id != ? AND e.role_applied = ?
      ORDER BY ABS(e.match_score - (SELECT match_score FROM evaluations WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 1)) ASC
      LIMIT ?
    `;
    const params = [candidateId, roleApplied || '', candidateId, parseInt(limit)];

    const result = await query(sql, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    const similar = result.data.map(row => ({
      id: row.id,
      candidateName: row.candidate_name,
      roleApplied: row.role_applied,
      matchScore: row.match_score,
      verdict: row.verdict,
      location: row.candidate_location,
      evaluatedAt: row.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: similar,
    });
  } catch (error) {
    console.error('Error finding similar candidates:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to find similar candidates',
      details: error.message,
    });
  }
}

