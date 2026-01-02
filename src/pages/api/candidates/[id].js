import { query } from '@/lib/db';

export default async function handler(req, res) {
  // Ensure all responses are JSON
  const sendJsonResponse = (status, data) => {
    try {
      return res.status(status).json(data);
    } catch (err) {
      console.error('Error sending JSON response:', err);
      // Fallback: send plain text if JSON fails
      return res.status(status).send(JSON.stringify(data));
    }
  };

  const { id } = req.query;

  if (req.method !== 'GET') {
    return sendJsonResponse(405, { success: false, error: 'Method not allowed' });
  }

  if (!id) {
    return sendJsonResponse(400, { success: false, error: 'Candidate ID is required' });
  }

  try {
    // Get candidate data
    const candidateResult = await query(
      `SELECT 
        c.id,
        c.candidate_name,
        c.candidate_email,
        c.candidate_whatsapp,
        c.candidate_location,
        c.linkedin_url,
        c.current_designation,
        c.current_company,
        c.total_experience_years,
        c.number_of_companies,
        c.profile_summary,
        c.current_stage,
        c.created_at,
        c.updated_at
      FROM candidates c
      WHERE c.id = ?`,
      [id]
    );

    if (!candidateResult || !candidateResult.success) {
      const errorMsg = candidateResult?.error || 'Failed to fetch candidate data from database';
      console.error('Query failed:', errorMsg, candidateResult);
      return sendJsonResponse(500, { 
        success: false,
        error: String(errorMsg)
      });
    }

    if (!candidateResult.data || candidateResult.data.length === 0) {
      return sendJsonResponse(404, { 
        success: false,
        error: 'Candidate not found' 
      });
    }

    const candidate = candidateResult.data[0];

    // Get all evaluations for this candidate
    // Using DISTINCT to prevent duplicates in case of data integrity issues
    const evaluationsResult = await query(
      `SELECT DISTINCT
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
        jd.title as job_title,
        jd.description as job_description_content
      FROM evaluations e
      LEFT JOIN job_descriptions jd ON e.job_description_id = jd.id
      WHERE e.candidate_id = ?
      ORDER BY e.created_at DESC`,
      [id]
    );

    // Helper function to safely parse JSON fields
    const safeJsonParse = (value, defaultValue) => {
      if (value === null || value === undefined) return defaultValue;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          console.warn('Failed to parse JSON:', e.message, value);
          return defaultValue;
        }
      }
      // If it's already an object/array, return it as is
      return value;
    };

    // Filter evaluations to ensure they belong to this candidate (data integrity check)
    const candidateIdNum = parseInt(id, 10);
    const evaluations = evaluationsResult.success && evaluationsResult.data
      ? evaluationsResult.data
          .filter(evaluation => {
            // Double-check: ensure evaluation belongs to this candidate
            const evalCandidateId = evaluation.candidate_id;
            if (evalCandidateId != candidateIdNum) {
              console.warn(`[candidates/${id}] Filtering out evaluation ${evaluation.id} - belongs to candidate ${evalCandidateId}, not ${candidateIdNum}`);
              return false;
            }
            return true;
          })
          .map(evaluation => ({
            id: evaluation.id,
            candidateId: evaluation.candidate_id,
            jobDescriptionId: evaluation.job_description_id,
            roleApplied: evaluation.role_applied,
            companyLocation: evaluation.company_location,
            experience: evaluation.experience_ctc_notice_location,
            workExperience: safeJsonParse(evaluation.work_experience, []),
            verdict: evaluation.verdict,
            matchScore: evaluation.match_score,
            scoreBreakdown: safeJsonParse(evaluation.score_breakdown, {}),
            strengths: safeJsonParse(evaluation.key_strengths, []),
            gaps: safeJsonParse(evaluation.gaps, []),
            educationGaps: safeJsonParse(evaluation.education_gaps, []),
            experienceGaps: safeJsonParse(evaluation.experience_gaps, []),
            betterSuitedFocus: evaluation.better_suited_focus,
            emailDraft: safeJsonParse(evaluation.email_draft, {}),
            whatsappDraft: safeJsonParse(evaluation.whatsapp_draft, {}),
            createdAt: evaluation.created_at,
            updatedAt: evaluation.updated_at,
            jobTitle: evaluation.job_title,
            jobDescriptionContent: evaluation.job_description_content,
          }))
      : [];

    // Get communication logs (email and WhatsApp)
    const emailLogsResult = await query(
      `SELECT 
        el.id,
        el.evaluation_id,
        e.candidate_id,
        el.to_email,
        el.subject,
        el.body,
        el.status,
        el.error_message,
        el.sent_at,
        el.created_at
      FROM email_logs el
      INNER JOIN evaluations e ON el.evaluation_id = e.id
      WHERE e.candidate_id = ?
      ORDER BY el.created_at DESC
      LIMIT 50`,
      [id]
    );

    const emailLogs = emailLogsResult.success && emailLogsResult.data
      ? emailLogsResult.data.filter(log => String(log.candidate_id) === String(id))
      : [];

    const whatsappLogsResult = await query(
      `SELECT 
        wl.id,
        wl.evaluation_id,
        e.candidate_id,
        wl.to_whatsapp,
        wl.message,
        wl.status,
        wl.error_message,
        wl.message_id,
        wl.conversation_id,
        wl.sent_at,
        wl.created_at
      FROM whatsapp_logs wl
      INNER JOIN evaluations e ON wl.evaluation_id = e.id
      WHERE e.candidate_id = ?
      ORDER BY wl.created_at DESC
      LIMIT 50`,
      [id]
    );

    const whatsappLogs = whatsappLogsResult.success && whatsappLogsResult.data
      ? whatsappLogsResult.data.filter(log => String(log.candidate_id) === String(id))
      : [];

    // Get stage history (if table exists)
    let stageHistory = [];
    try {
      const stageHistoryResult = await query(
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
      // Format stage history with proper date handling
      stageHistory = stageHistoryResult.success && stageHistoryResult.data
        ? stageHistoryResult.data.map(entry => ({
            id: entry.id,
            candidateId: entry.candidate_id,
            evaluationId: entry.evaluation_id,
            stage: entry.stage,
            comment: entry.comment,
            changedBy: entry.changed_by,
            createdAt: entry.created_at ? new Date(entry.created_at).toISOString() : null,
          }))
        : [];
    } catch (err) {
      // Table might not exist yet - that's okay
      console.warn('candidate_stages table not found, skipping stage history:', err.message);
      stageHistory = [];
    }

    // Get resume file info (if any)
    const resumeResult = await query(
      `SELECT 
        r.id,
        r.evaluation_id,
        r.file_name,
        r.file_type,
        r.file_size,
        r.created_at
      FROM resumes r
      INNER JOIN evaluations e ON r.evaluation_id = e.id
      WHERE e.candidate_id = ?
      ORDER BY r.created_at DESC
      LIMIT 1`,
      [id]
    );

    const resume = resumeResult.success && resumeResult.data && resumeResult.data.length > 0
      ? {
          id: resumeResult.data[0].id,
          evaluationId: resumeResult.data[0].evaluation_id,
          fileName: resumeResult.data[0].file_name,
          fileType: resumeResult.data[0].file_type,
          fileSize: resumeResult.data[0].file_size,
          createdAt: resumeResult.data[0].created_at,
        }
      : null;

    // Format candidate data
    const candidateData = {
      id: candidate.id,
      candidateName: candidate.candidate_name,
      candidateEmail: candidate.candidate_email,
      candidateWhatsApp: candidate.candidate_whatsapp,
      candidateLocation: candidate.candidate_location,
      linkedInUrl: candidate.linkedin_url || '',
      currentDesignation: candidate.current_designation,
      currentCompany: candidate.current_company,
      totalExperienceYears: candidate.total_experience_years,
      numberOfCompanies: candidate.number_of_companies,
      profileSummary: candidate.profile_summary,
      currentStage: candidate.current_stage || 'Applied/Received',
      createdAt: candidate.created_at,
      updatedAt: candidate.updated_at,
      evaluations,
      emailLogs,
      whatsappLogs,
      stageHistory,
      resume,
    };

    return sendJsonResponse(200, {
      success: true,
      data: candidateData,
    });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    console.error('Error stack:', error?.stack);
    // Ensure we return a proper JSON response even on error
    const errorMessage = error?.message || String(error) || 'Failed to fetch candidate data';
    return sendJsonResponse(500, {
      success: false,
      error: String(errorMessage),
    });
  }
}
