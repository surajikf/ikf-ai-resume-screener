import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const isMySQL = process.env.DB_PROVIDER !== 'supabase';

    // First, ensure tables exist (MySQL only)
    if (isMySQL) {
      try {
        await query(`
        CREATE TABLE IF NOT EXISTS \`candidates\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`candidate_name\` VARCHAR(255) NOT NULL,
          \`candidate_email\` VARCHAR(255) DEFAULT NULL,
          \`candidate_whatsapp\` VARCHAR(20) DEFAULT NULL,
          \`candidate_location\` VARCHAR(255) DEFAULT NULL,
          \`linkedin_url\` VARCHAR(500) DEFAULT NULL,
          \`current_designation\` VARCHAR(255) DEFAULT NULL,
          \`current_company\` VARCHAR(255) DEFAULT NULL,
          \`total_experience_years\` DECIMAL(4,2) DEFAULT NULL,
          \`number_of_companies\` INT DEFAULT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
        await query(`
        CREATE TABLE IF NOT EXISTS \`evaluations\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`candidate_id\` INT NOT NULL,
          \`job_description_id\` INT DEFAULT NULL,
          \`role_applied\` VARCHAR(255) NOT NULL,
          \`company_location\` VARCHAR(255) DEFAULT NULL,
          \`experience_ctc_notice_location\` TEXT DEFAULT NULL,
          \`work_experience\` JSON DEFAULT NULL,
          \`verdict\` ENUM('Recommended', 'Partially Suitable', 'Not Suitable') NOT NULL,
          \`match_score\` INT NOT NULL DEFAULT 0,
          \`score_breakdown\` JSON DEFAULT NULL,
          \`key_strengths\` JSON DEFAULT NULL,
          \`gaps\` JSON DEFAULT NULL,
          \`education_gaps\` JSON DEFAULT NULL,
          \`experience_gaps\` JSON DEFAULT NULL,
          \`better_suited_focus\` TEXT DEFAULT NULL,
          \`email_draft\` JSON DEFAULT NULL,
          \`whatsapp_draft\` JSON DEFAULT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (\`candidate_id\`) REFERENCES \`candidates\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      } catch (tableError) {
        console.error('[evaluations/list] Failed to create tables:', tableError);
        // Continue anyway - tables might already exist
      }
    }

    const { limit = 50, offset = 0, verdict, search } = req.query;

    // Optimized query with better index usage
    let sql = `
      SELECT 
        e.id,
        e.candidate_id,
        e.job_description_id,
        e.role_applied,
        e.company_location,
        e.experience_ctc_notice_location,
        e.work_experience,
        e.verdict,
        e.match_score,
        e.score_breakdown,
        e.key_strengths,
        e.gaps,
        e.education_gaps,
        e.experience_gaps,
        e.better_suited_focus,
        e.email_draft,
        e.whatsapp_draft,
        e.created_at,
        e.updated_at,
        c.candidate_name,
        c.candidate_email,
        c.candidate_whatsapp,
        c.candidate_location,
        c.linkedin_url,
        c.current_designation,
        c.current_company,
        c.total_experience_years,
        c.number_of_companies,
        jd.id as job_description_id,
        jd.title as job_title,
        jd.jd_link as job_description_link,
        jd.description as job_description_content,
        jd.created_at as job_description_created_at
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
      console.error('[evaluations/list] Query failed:', result.error);
      // Return empty array instead of 500 error - app can still work
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false,
        },
        error: result.error,
      });
    }

    // Parse JSON fields and include candidate profile data
    const evaluations = result.data.map(evaluation => ({
      id: evaluation.id,
      databaseId: evaluation.id,
      candidateId: evaluation.candidate_id,
      candidateName: evaluation.candidate_name,
      candidateEmail: evaluation.candidate_email,
      candidateWhatsApp: evaluation.candidate_whatsapp,
      candidateLocation: evaluation.candidate_location,
      linkedInUrl: evaluation.linkedin_url || '',
      currentDesignation: evaluation.current_designation || null,
      currentCompany: evaluation.current_company || null,
      totalExperienceYears: evaluation.total_experience_years || null,
      numberOfCompanies: evaluation.number_of_companies || null,
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
      updatedAt: evaluation.updated_at,
      // Job Description details
      jobDescriptionId: evaluation.job_description_id || null,
      jobTitle: evaluation.job_title || null,
      jobDescriptionLink: evaluation.job_description_link || null,
      jobDescriptionContent: evaluation.job_description_content || null,
      jobDescriptionCreatedAt: evaluation.job_description_created_at || null,
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
    // Return empty array instead of 500 error - app can still work
    return res.status(200).json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        limit: parseInt(req.query.limit || 50),
        offset: parseInt(req.query.offset || 0),
        hasMore: false,
      },
      error: error.message,
    });
  }
}

