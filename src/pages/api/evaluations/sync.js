import { query, getConnection } from '@/lib/db';

/**
 * Sync evaluations from localStorage to Supabase
 * This endpoint handles syncing evaluations that exist in localStorage but not in database
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { evaluations } = req.body;

    if (!evaluations || !Array.isArray(evaluations)) {
      return res.status(400).json({
        success: false,
        error: 'Evaluations array is required',
      });
    }

    // Filter evaluations that don't have databaseId (not synced yet)
    const unsyncedEvaluations = evaluations.filter(evaluation => !evaluation.databaseId && !evaluation.id?.toString().startsWith('loading-'));

    if (unsyncedEvaluations.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All evaluations are already synced',
        synced: 0,
        skipped: evaluations.length,
      });
    }

    // Use transaction if available, otherwise process sequentially
    const connection = await getConnection();
    let useTransaction = false;
    if (connection && typeof connection.beginTransaction === 'function') {
      await connection.beginTransaction();
      useTransaction = true;
    }

    try {
      let syncedCount = 0;
      let skippedCount = 0;
      const errors = [];

      for (const evaluation of unsyncedEvaluations) {
        try {
          // Check if evaluation already exists in database
          // Use candidate matching logic similar to save endpoint
          let candidateId = null;

          // Strategy 1: Match by email
          if (evaluation.candidateEmail) {
            const emailResult = await query(
              'SELECT id FROM candidates WHERE candidate_email = $1 LIMIT 1',
              [evaluation.candidateEmail]
            );
            if (emailResult.success && emailResult.data && emailResult.data.length > 0) {
              candidateId = emailResult.data[0].id;
            }
          }

          // Strategy 2: Match by WhatsApp
          if (!candidateId && evaluation.candidateWhatsApp) {
            const whatsappResult = await query(
              'SELECT id FROM candidates WHERE candidate_whatsapp = $1 LIMIT 1',
              [evaluation.candidateWhatsApp]
            );
            if (whatsappResult.success && whatsappResult.data && whatsappResult.data.length > 0) {
              candidateId = whatsappResult.data[0].id;
            }
          }

          // Strategy 3: Match by LinkedIn
          if (!candidateId && evaluation.linkedInUrl) {
            const linkedinResult = await query(
              'SELECT id FROM candidates WHERE linkedin_url = $1 LIMIT 1',
              [evaluation.linkedInUrl]
            );
            if (linkedinResult.success && linkedinResult.data && linkedinResult.data.length > 0) {
              candidateId = linkedinResult.data[0].id;
            }
          }

          // Strategy 4: Match by name (fuzzy)
          if (!candidateId && evaluation.candidateName) {
            const normalizedName = evaluation.candidateName.trim().toLowerCase().replace(/\s+/g, ' ');
            const nameResult = await query(
              `SELECT id FROM candidates WHERE LOWER(TRIM(REPLACE(candidate_name, '  ', ' '))) = $1 LIMIT 1`,
              [normalizedName]
            );
            if (nameResult.success && nameResult.data && nameResult.data.length > 0) {
              candidateId = nameResult.data[0].id;
            }
          }

          // Check if evaluation already exists for this candidate and role
          if (candidateId) {
            const createdAt = evaluation.createdAt || new Date().toISOString();
            const existingEval = await query(
              `SELECT id FROM evaluations 
               WHERE candidate_id = $1 AND role_applied = $2 
               AND ABS(EXTRACT(EPOCH FROM (created_at::timestamp - $3::timestamp)) / 60) < 5
               LIMIT 1`,
              [candidateId, evaluation.roleApplied || 'Unknown', createdAt]
            );

            if (existingEval.success && existingEval.data && existingEval.data.length > 0) {
              skippedCount++;
              continue; // Skip - already exists
            }
          }

          // Extract work experience data
          const workExp = evaluation.workExperience || [];
          const latestExp = workExp.length > 0 ? workExp[0] : null;
          const currentDesignation = latestExp?.role || null;
          const currentCompany = latestExp?.companyName || null;

          // Calculate total experience
          let totalExpYears = null;
          let numberOfCompanies = null;
          if (workExp.length > 0) {
            const totalExpItem = workExp.find(exp => exp.companyName === 'Total Experience');
            if (totalExpItem && totalExpItem.duration) {
              const yearsMatch = totalExpItem.duration.match(/(\d+)\s*years?/i);
              const monthsMatch = totalExpItem.duration.match(/(\d+)\s*months?/i);
              const years = yearsMatch ? parseFloat(yearsMatch[1]) : 0;
              const months = monthsMatch ? parseFloat(monthsMatch[1]) : 0;
              totalExpYears = years + (months / 12);
            }
            numberOfCompanies = workExp.filter(exp => exp.companyName !== 'Total Experience').length;
          }

          // Create or update candidate
          if (candidateId) {
            await query(
              `UPDATE candidates SET
                candidate_name = ?,
                candidate_email = COALESCE(?, candidate_email),
                candidate_whatsapp = COALESCE(?, candidate_whatsapp),
                candidate_location = COALESCE(?, candidate_location),
                linkedin_url = COALESCE(?, linkedin_url),
                current_designation = COALESCE(?, current_designation),
                current_company = COALESCE(?, current_company),
                total_experience_years = COALESCE(?, total_experience_years),
                number_of_companies = COALESCE(?, number_of_companies),
                updated_at = NOW()
               WHERE id = ?`,
              [
                evaluation.candidateName,
                evaluation.candidateEmail || null,
                evaluation.candidateWhatsApp || null,
                evaluation.candidateLocation || null,
                evaluation.linkedInUrl || null,
                currentDesignation,
                currentCompany,
                totalExpYears,
                numberOfCompanies,
                candidateId,
              ]
            );
          } else {
            const candidateResult = await query(
              `INSERT INTO candidates (
                candidate_name, candidate_email, candidate_whatsapp, candidate_location,
                linkedin_url, current_designation, current_company,
                total_experience_years, number_of_companies
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                evaluation.candidateName,
                evaluation.candidateEmail || null,
                evaluation.candidateWhatsApp || null,
                evaluation.candidateLocation || null,
                evaluation.linkedInUrl || null,
                currentDesignation,
                currentCompany,
                totalExpYears,
                numberOfCompanies,
              ]
            );
            candidateId = candidateResult.data?.insertId || candidateResult.insertId;
          }

          // Insert evaluation
          const evaluationResult = await query(
            `INSERT INTO evaluations (
              candidate_id, job_description_id, role_applied, company_location,
              experience_ctc_notice_location, work_experience, verdict, match_score,
              score_breakdown, key_strengths, gaps, education_gaps, experience_gaps,
              better_suited_focus, email_draft, whatsapp_draft, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              candidateId,
              null, // job_description_id
              evaluation.roleApplied || 'Unknown',
              evaluation.companyLocation || null,
              evaluation.experience || null,
              JSON.stringify(workExp),
              evaluation.verdict || 'Not Suitable',
              evaluation.matchScore || 0,
              JSON.stringify(evaluation.scoreBreakdown || {}),
              JSON.stringify(evaluation.strengths || []),
              JSON.stringify(evaluation.gaps || []),
              JSON.stringify(evaluation.educationGaps || []),
              JSON.stringify(evaluation.experienceGaps || []),
              evaluation.betterSuitedFocus || null,
              JSON.stringify(evaluation.emailDraft || {}),
              JSON.stringify(evaluation.whatsappDraft || {}),
              evaluation.createdAt || new Date().toISOString(),
            ]
          );

          syncedCount++;
        } catch (error) {
          console.error(`Error syncing evaluation for ${evaluation.candidateName}:`, error);
          errors.push({
            candidateName: evaluation.candidateName,
            error: error.message,
          });
        }
      }

      if (useTransaction && connection.commit) {
        await connection.commit();
      }
      if (connection && typeof connection.release === 'function') {
        connection.release();
      }

      return res.status(200).json({
        success: true,
        message: `Synced ${syncedCount} evaluation(s) to database`,
        synced: syncedCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      if (useTransaction && connection.rollback) {
        await connection.rollback();
      }
      if (connection && typeof connection.release === 'function') {
        connection.release();
      }
      throw error;
    }
  } catch (error) {
    console.error('Error syncing evaluations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync evaluations',
      details: error.message,
    });
  }
}

