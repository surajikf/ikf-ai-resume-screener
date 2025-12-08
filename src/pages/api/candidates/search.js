import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }

    const searchTerm = `%${q.trim()}%`;
    
    const result = await query(
      `SELECT DISTINCT
        c.id,
        c.candidate_name,
        c.candidate_email,
        c.candidate_whatsapp,
        c.candidate_location,
        COUNT(e.id) as evaluation_count,
        MAX(e.created_at) as last_evaluated,
        AVG(e.match_score) as avg_score
      FROM candidates c
      LEFT JOIN evaluations e ON c.id = e.candidate_id
      WHERE 
        c.candidate_name LIKE ? OR
        c.candidate_email LIKE ? OR
        c.candidate_whatsapp LIKE ?
      GROUP BY c.id
      ORDER BY last_evaluated DESC
      LIMIT ?`,
      [searchTerm, searchTerm, searchTerm, parseInt(limit)]
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    const candidates = result.data.map(row => ({
      id: row.id,
      name: row.candidate_name,
      email: row.candidate_email,
      whatsapp: row.candidate_whatsapp,
      location: row.candidate_location,
      evaluationCount: row.evaluation_count,
      lastEvaluated: row.last_evaluated,
      avgScore: Math.round(row.avg_score || 0),
    }));

    return res.status(200).json({
      success: true,
      data: candidates,
      count: candidates.length,
    });
  } catch (error) {
    console.error('Error searching candidates:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search candidates',
      details: error.message,
    });
  }
}

