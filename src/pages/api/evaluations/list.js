import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = 50, offset = 0, verdict, search } = req.query;

    let sql = `
      SELECT 
        e.*,
        c.candidate_name,
        c.candidate_email,
        c.candidate_whatsapp,
        c.candidate_location,
        jd.title as job_title
      FROM evaluations e
      INNER JOIN candidates c ON e.candidate_id = c.id
      LEFT JOIN job_descriptions jd ON e.job_description_id = jd.id
      WHERE 1=1
    `;
    const params = [];

    if (verdict) {
      sql += ' AND e.verdict = ?';
      params.push(verdict);
    }

    if (search) {
      sql += ' AND (c.candidate_name LIKE ? OR c.candidate_email LIKE ? OR e.role_applied LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    // Parse JSON fields
    const evaluations = result.data.map(evaluation => ({
      id: evaluation.id,
      candidateName: evaluation.candidate_name,
      candidateEmail: evaluation.candidate_email,
      candidateWhatsApp: evaluation.candidate_whatsapp,
      candidateLocation: evaluation.candidate_location,
      roleApplied: evaluation.role_applied,
      companyLocation: evaluation.company_location,
      experience: evaluation.experience_ctc_notice_location,
      workExperience: JSON.parse(evaluation.work_experience || '[]'),
      verdict: evaluation.verdict,
      matchScore: evaluation.match_score,
      scoreBreakdown: JSON.parse(evaluation.score_breakdown || '{}'),
      strengths: JSON.parse(evaluation.key_strengths || '[]'),
      gaps: JSON.parse(evaluation.gaps || '[]'),
      educationGaps: JSON.parse(evaluation.education_gaps || '[]'),
      experienceGaps: JSON.parse(evaluation.experience_gaps || '[]'),
      betterSuitedFocus: evaluation.better_suited_focus,
      emailDraft: JSON.parse(evaluation.email_draft || '{}'),
      whatsappDraft: JSON.parse(evaluation.whatsapp_draft || '{}'),
      createdAt: evaluation.created_at,
      jobTitle: evaluation.job_title,
    }));

    // Get total count
    let countSql = `
      SELECT COUNT(*) as total
      FROM evaluations e
      INNER JOIN candidates c ON e.candidate_id = c.id
      WHERE 1=1
    `;
    const countParams = [];

    if (verdict) {
      countSql += ' AND e.verdict = ?';
      countParams.push(verdict);
    }

    if (search) {
      countSql += ' AND (c.candidate_name LIKE ? OR c.candidate_email LIKE ? OR e.role_applied LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult.success ? countResult.data[0].total : 0;

    return res.status(200).json({
      success: true,
      data: evaluations,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + evaluations.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch evaluations',
      details: error.message,
    });
  }
}

