import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { candidateName } = req.query;

    if (!candidateName) {
      return res.status(400).json({
        success: false,
        error: 'Candidate name is required',
      });
    }

    // Smart duplicate detection: check by name, email, or WhatsApp
    const result = await query(
      `SELECT e.*, c.candidate_name, c.candidate_email, c.candidate_whatsapp
       FROM evaluations e
       INNER JOIN candidates c ON e.candidate_id = c.id
       WHERE 
         c.candidate_name = ? OR
         (c.candidate_email = ? AND c.candidate_email != '' AND c.candidate_email IS NOT NULL) OR
         (c.candidate_whatsapp = ? AND c.candidate_whatsapp != '' AND c.candidate_whatsapp IS NOT NULL)
       ORDER BY e.created_at DESC
       LIMIT 1`,
      [candidateName, candidateName, candidateName]
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    if (result.data.length === 0) {
      return res.status(200).json({
        success: true,
        isDuplicate: false,
        data: null,
      });
    }

    const previousEval = result.data[0];
    return res.status(200).json({
      success: true,
      isDuplicate: true,
      data: {
        roleApplied: previousEval.role_applied,
        createdAt: previousEval.created_at,
        matchScore: previousEval.match_score,
        verdict: previousEval.verdict,
      },
    });
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check duplicate',
      details: error.message,
    });
  }
}

