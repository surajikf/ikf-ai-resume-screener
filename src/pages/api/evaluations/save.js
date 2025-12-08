import { query, getConnection } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      candidateName,
      candidateEmail,
      candidateWhatsApp,
      candidateLocation,
      roleApplied,
      companyLocation,
      experienceCtcNoticeLocation,
      workExperience,
      verdict,
      matchScore,
      scoreBreakdown,
      keyStrengths,
      gaps,
      educationGaps,
      experienceGaps,
      betterSuitedFocus,
      emailDraft,
      whatsappDraft,
      jobDescriptionId,
    } = req.body;

    // Start transaction by getting connection
    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // Helper to execute queries on the transaction connection
      const executeQuery = async (sql, params = []) => {
        const [results] = await connection.execute(sql, params);
        return results;
      };

      // 1. Smart candidate matching: check by name, email, or WhatsApp
      let candidateId;
      let candidateCheck;
      
      // Try to find by email first (most reliable)
      if (candidateEmail) {
        const results = await executeQuery(
          'SELECT id FROM candidates WHERE candidate_email = ?',
          [candidateEmail]
        );
        candidateCheck = { success: true, data: results };
      }
      
      // If not found by email, try WhatsApp
      if (!candidateCheck?.data || candidateCheck.data.length === 0) {
        if (candidateWhatsApp) {
          const results = await executeQuery(
            'SELECT id FROM candidates WHERE candidate_whatsapp = ?',
            [candidateWhatsApp]
          );
          candidateCheck = { success: true, data: results };
        }
      }
      
      // If still not found, try by name (less reliable, but better than nothing)
      if (!candidateCheck?.data || candidateCheck.data.length === 0) {
        const results = await executeQuery(
          'SELECT id FROM candidates WHERE candidate_name = ?',
          [candidateName]
        );
        candidateCheck = { success: true, data: results };
      }

      if (candidateCheck.data && candidateCheck.data.length > 0) {
        candidateId = candidateCheck.data[0].id;
        // Update candidate info with latest data
        await executeQuery(
          'UPDATE candidates SET candidate_name = ?, candidate_email = COALESCE(?, candidate_email), candidate_whatsapp = COALESCE(?, candidate_whatsapp), candidate_location = COALESCE(?, candidate_location), updated_at = NOW() WHERE id = ?',
          [candidateName, candidateEmail || null, candidateWhatsApp || null, candidateLocation || null, candidateId]
        );
      } else {
        // New candidate
        const candidateInsert = await executeQuery(
          'INSERT INTO candidates (candidate_name, candidate_email, candidate_whatsapp, candidate_location) VALUES (?, ?, ?, ?)',
          [candidateName, candidateEmail || null, candidateWhatsApp || null, candidateLocation || null]
        );
        candidateId = candidateInsert.insertId;
      }

      // 2. Insert evaluation
      const evaluationInsert = await executeQuery(
        `INSERT INTO evaluations (
          candidate_id, job_description_id, role_applied, company_location,
          experience_ctc_notice_location, work_experience, verdict, match_score,
          score_breakdown, key_strengths, gaps, education_gaps, experience_gaps,
          better_suited_focus, email_draft, whatsapp_draft
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          candidateId,
          jobDescriptionId || null,
          roleApplied,
          companyLocation || null,
          experienceCtcNoticeLocation || null,
          JSON.stringify(workExperience || []),
          verdict,
          matchScore,
          JSON.stringify(scoreBreakdown || {}),
          JSON.stringify(keyStrengths || []),
          JSON.stringify(gaps || []),
          JSON.stringify(educationGaps || []),
          JSON.stringify(experienceGaps || []),
          betterSuitedFocus || null,
          JSON.stringify(emailDraft || {}),
          JSON.stringify(whatsappDraft || {}),
        ]
      );

      const evaluationId = evaluationInsert.insertId;

      await connection.commit();
      connection.release();

      return res.status(200).json({
        success: true,
        message: 'Evaluation saved successfully',
        data: {
          evaluationId,
          candidateId,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error saving evaluation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save evaluation',
      details: error.message,
    });
  }
}

