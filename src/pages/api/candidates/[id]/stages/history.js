import { query } from '@/lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Candidate ID is required' });
  }

  try {
    const result = await query(
      `SELECT 
        cs.id,
        cs.candidate_id,
        cs.evaluation_id,
        cs.stage,
        cs.comment,
        cs.changed_by,
        cs.created_at
      FROM candidate_stages cs
      WHERE cs.candidate_id = ?
      ORDER BY cs.created_at DESC`,
      [id]
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch stage history',
      });
    }

    const stageHistory = result.data.map(entry => ({
      id: entry.id,
      candidateId: entry.candidate_id,
      evaluationId: entry.evaluation_id,
      stage: entry.stage,
      comment: entry.comment,
      changedBy: entry.changed_by,
      createdAt: entry.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: stageHistory,
    });
  } catch (error) {
    console.error('Error fetching stage history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch stage history',
    });
  }
}

