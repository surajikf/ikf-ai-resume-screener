// Migration utility to move localStorage data to MySQL database
// This is a one-time migration script

import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { localStorageData } = req.body;

    if (!localStorageData) {
      return res.status(400).json({
        success: false,
        error: 'localStorageData is required',
      });
    }

    const results = {
      jobDescriptions: { migrated: 0, errors: 0 },
      evaluations: { migrated: 0, errors: 0 },
    };

    // Migrate job descriptions
    if (localStorageData.jobDescriptions && Array.isArray(localStorageData.jobDescriptions)) {
      for (const jd of localStorageData.jobDescriptions) {
        try {
          const result = await query(
            'INSERT INTO job_descriptions (title, description) VALUES (?, ?)',
            [jd.title || 'Untitled JD', jd.content || '']
          );
          if (result.success) {
            results.jobDescriptions.migrated++;
          } else {
            results.jobDescriptions.errors++;
          }
        } catch (err) {
          results.jobDescriptions.errors++;
        }
      }
    }

    // Migrate evaluations (this is more complex as it requires candidate creation)
    if (localStorageData.evaluations && Array.isArray(localStorageData.evaluations)) {
      for (const evaluation of localStorageData.evaluations) {
        try {
          // 1. Create or get candidate
          let candidateId;
          const candidateCheck = await query(
            'SELECT id FROM candidates WHERE candidate_name = ? AND candidate_email = ?',
            [evaluation.candidateName || 'Unknown', evaluation.candidateEmail || '']
          );

          if (candidateCheck.success && candidateCheck.data.length > 0) {
            candidateId = candidateCheck.data[0].id;
          } else {
            const candidateInsert = await query(
              'INSERT INTO candidates (candidate_name, candidate_email, candidate_whatsapp, candidate_location) VALUES (?, ?, ?, ?)',
              [
                evaluation.candidateName || 'Unknown',
                evaluation.candidateEmail || null,
                evaluation.candidateWhatsApp || null,
                evaluation.candidateLocation || null,
              ]
            );
            candidateId = candidateInsert.data.insertId;
          }

          // 2. Insert evaluation
          const evalInsert = await query(
            `INSERT INTO evaluations (
              candidate_id, role_applied, company_location,
              experience_ctc_notice_location, work_experience, verdict, match_score,
              score_breakdown, key_strengths, gaps, education_gaps, experience_gaps,
              better_suited_focus, email_draft, whatsapp_draft
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              candidateId,
              evaluation.roleApplied || '',
              evaluation.companyLocation || null,
              evaluation.experience || null,
              JSON.stringify(evaluation.workExperience || []),
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
            ]
          );

          if (evalInsert.success) {
            results.evaluations.migrated++;
          } else {
            results.evaluations.errors++;
          }
        } catch (err) {
          results.evaluations.errors++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Migration completed',
      results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error.message,
    });
  }
}

