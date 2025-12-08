import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { candidateId, roleApplied, dateFrom, dateTo } = req.query;

    let sql = `
      SELECT 
        COUNT(*) as total,
        AVG(match_score) as avg_score,
        MIN(match_score) as min_score,
        MAX(match_score) as max_score,
        SUM(CASE WHEN verdict = 'Recommended' THEN 1 ELSE 0 END) as recommended,
        SUM(CASE WHEN verdict = 'Partially Suitable' THEN 1 ELSE 0 END) as partially_suitable,
        SUM(CASE WHEN verdict = 'Not Suitable' THEN 1 ELSE 0 END) as not_suitable
      FROM evaluations
      WHERE 1=1
    `;
    const params = [];

    if (candidateId) {
      sql += ' AND candidate_id = ?';
      params.push(candidateId);
    }

    if (roleApplied) {
      sql += ' AND role_applied = ?';
      params.push(roleApplied);
    }

    if (dateFrom) {
      sql += ' AND created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      sql += ' AND created_at <= ?';
      params.push(dateTo);
    }

    const result = await query(sql, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    const stats = result.data[0];

    return res.status(200).json({
      success: true,
      data: {
        total: stats.total,
        averageScore: Math.round(stats.avg_score || 0),
        minScore: stats.min_score || 0,
        maxScore: stats.max_score || 0,
        verdicts: {
          recommended: stats.recommended,
          partiallySuitable: stats.partially_suitable,
          notSuitable: stats.not_suitable,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching evaluation stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch evaluation stats',
      details: error.message,
    });
  }
}

