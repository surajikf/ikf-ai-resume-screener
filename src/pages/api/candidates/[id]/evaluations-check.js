import { query } from '@/lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!id) {
    return res.status(400).json({ success: false, error: 'Candidate ID is required' });
  }

  try {
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM evaluations WHERE candidate_id = ?`,
      [id]
    );

    // Get unique count
    const uniqueCountResult = await query(
      `SELECT COUNT(DISTINCT id) as count FROM evaluations WHERE candidate_id = ?`,
      [id]
    );

    // Check for duplicates (same role, same date)
    const duplicateCheck = await query(
      `SELECT 
        role_applied,
        DATE(created_at) as eval_date,
        COUNT(*) as count,
        GROUP_CONCAT(id ORDER BY id) as evaluation_ids
      FROM evaluations 
      WHERE candidate_id = ?
      GROUP BY role_applied, DATE(created_at)
      HAVING count > 1
      ORDER BY eval_date DESC`,
      [id]
    );

    // Get sample of evaluations
    const sampleResult = await query(
      `SELECT 
        id,
        role_applied,
        verdict,
        match_score,
        created_at
      FROM evaluations 
      WHERE candidate_id = ?
      ORDER BY created_at DESC
      LIMIT 10`,
      [id]
    );

    // Get all evaluations grouped by date
    const byDateResult = await query(
      `SELECT 
        DATE(created_at) as eval_date,
        COUNT(*) as count
      FROM evaluations 
      WHERE candidate_id = ?
      GROUP BY DATE(created_at)
      ORDER BY eval_date DESC
      LIMIT 20`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        totalCount: countResult.success ? countResult.data[0]?.count : 0,
        uniqueCount: uniqueCountResult.success ? uniqueCountResult.data[0]?.count : 0,
        duplicates: duplicateCheck.success ? duplicateCheck.data : [],
        sample: sampleResult.success ? sampleResult.data : [],
        byDate: byDateResult.success ? byDateResult.data : [],
        hasDuplicates: duplicateCheck.success && duplicateCheck.data.length > 0,
      },
    });
  } catch (error) {
    console.error('Error checking evaluations:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check evaluations',
    });
  }
}

