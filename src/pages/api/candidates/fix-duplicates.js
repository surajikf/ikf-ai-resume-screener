import { query, getConnection } from '@/lib/db';

export default async function handler(req, res) {
  // Allow both GET and POST for easier access
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // For GET requests, require confirmation parameter
  if (req.method === 'GET' && req.query.confirm !== 'true') {
    return res.status(200).json({
      message: 'This endpoint will fix duplicate candidates by creating separate records for the 2 most recent evaluations.',
      instructions: 'To proceed, visit: /api/candidates/fix-duplicates?confirm=true',
      warning: 'This will modify your database. Make sure you have a backup.',
    });
  }

  try {
    console.log('[candidates/fix-duplicates] ========== STARTING FIX ==========');
    
    // Get the most recent evaluations (last 2-3) that are all linked to candidate_id 1
    // First get evaluations, then get candidate data separately to avoid JOIN issues with Supabase
    const recentEvalsResult = await query(`
      SELECT 
        id,
        candidate_id,
        role_applied,
        company_location,
        experience_ctc_notice_location,
        work_experience,
        created_at
      FROM evaluations
      WHERE candidate_id = 1
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    if (!recentEvalsResult.success || !Array.isArray(recentEvalsResult.data)) {
      return res.status(200).json({
        success: false,
        message: 'Could not fetch recent evaluations',
        error: recentEvalsResult.error,
      });
    }
    
    // Get candidate data separately
    const candidateData = await query('SELECT candidate_name, candidate_email, candidate_whatsapp, candidate_location, linkedin_url FROM candidates WHERE id = 1 LIMIT 1');
    const candidateInfo = candidateData.success && candidateData.data?.length > 0 ? candidateData.data[0] : {};
    
    // Combine the data
    const recentEvals = {
      success: true,
      data: recentEvalsResult.data.map(evaluation => ({
        ...evaluation,
        candidate_name: candidateInfo.candidate_name,
        candidate_email: candidateInfo.candidate_email,
        candidate_whatsapp: candidateInfo.candidate_whatsapp,
        candidate_location: candidateInfo.candidate_location,
        linkedin_url: candidateInfo.linkedin_url,
      })),
    };

    if (!recentEvals.success || !Array.isArray(recentEvals.data) || recentEvals.data.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No recent evaluations found',
      });
    }

    console.log('[candidates/fix-duplicates] Found', recentEvals.data.length, 'recent evaluations');

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      const fixedCandidates = [];
      
      // Process the 2 most recent evaluations (likely Omkarn Torne and Rahul Maskare)
      for (let i = 0; i < Math.min(2, recentEvals.data.length); i++) {
        const evaluation = recentEvals.data[i];
        
        // Extract candidate info from evaluation
        // The work_experience JSON should contain the candidate's name and details
        let workExp = [];
        try {
          workExp = typeof evaluation.work_experience === 'string' 
            ? JSON.parse(evaluation.work_experience) 
            : (evaluation.work_experience || []);
        } catch (e) {
          console.warn('[candidates/fix-duplicates] Could not parse work_experience for evaluation', evaluation.id);
        }

        // Try to extract candidate name from multiple sources
        // The candidate name might be in the evaluation data, but we need to check the actual stored data
        // For now, we'll use a pattern: check if role_applied contains a name pattern
        // Or we can look at the resume file name if available
        
        // Get the resume file name from the resumes table
        const [resumeData] = await connection.execute(
          'SELECT file_name FROM resumes WHERE evaluation_id = ? LIMIT 1',
          [evaluation.id]
        );
        
        let candidateName = 'Unknown Candidate';
        
        // Try to extract from resume filename (e.g., "Omkarn Torne [4y_9m]_.pdf" -> "Omkarn Torne")
        if (resumeData.length > 0 && resumeData[0].file_name) {
          const fileName = resumeData[0].file_name;
          // Remove file extension
          const nameWithoutExt = fileName.replace(/\.(pdf|docx|doc)$/i, '');
          // Try to extract name before brackets or special characters
          const nameMatch = nameWithoutExt.match(/^([^[\]()_]+)/);
          if (nameMatch) {
            candidateName = nameMatch[1].trim();
            console.log('[candidates/fix-duplicates] Extracted name from resume filename:', candidateName);
          }
        }
        
        // Fallback: try role_applied if it looks like it contains a name
        if (candidateName === 'Unknown Candidate' && evaluation.role_applied) {
          // Sometimes format is "Name - Role" or "Name: Role"
          const namePatterns = [
            /^([^-:]+?)\s*[-:]\s*/,
            /^([A-Z][a-z]+\s+[A-Z][a-z]+)/, // First Last pattern
          ];
          
          for (const pattern of namePatterns) {
            const match = evaluation.role_applied.match(pattern);
            if (match && match[1]) {
              candidateName = match[1].trim();
              console.log('[candidates/fix-duplicates] Extracted name from role_applied:', candidateName);
              break;
            }
          }
        }
        
        // Extract other details from work experience
        const latestExp = workExp.length > 0 ? workExp[0] : null;
        const currentDesignation = latestExp?.role || null;
        const currentCompany = latestExp?.companyName || null;
        
        // Calculate experience
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

        // Extract location from experience_ctc_notice_location
        let candidateLocation = evaluation.candidate_location || evaluation.company_location || null;
        
        // Check if a candidate with this name already exists (but not candidate_id 1)
        const [existingCheck] = await connection.execute(
          'SELECT id FROM candidates WHERE candidate_name = ? AND id != 1 LIMIT 1',
          [candidateName]
        );

        if (existingCheck.length > 0) {
          console.log('[candidates/fix-duplicates] Candidate already exists:', candidateName, 'id:', existingCheck[0].id);
          // Update the evaluation to point to the existing candidate
          await connection.execute(
            'UPDATE evaluations SET candidate_id = ? WHERE id = ?',
            [existingCheck[0].id, evaluation.id]
          );
          fixedCandidates.push({
            evaluationId: evaluation.id,
            candidateId: existingCheck[0].id,
            candidateName,
            action: 'linked_to_existing',
          });
          continue;
        }

        // Create new candidate
        const [candidateInsert] = await connection.execute(
          `INSERT INTO candidates (
            candidate_name, 
            candidate_email, 
            candidate_whatsapp, 
            candidate_location,
            linkedin_url, 
            current_designation, 
            current_company,
            total_experience_years, 
            number_of_companies
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            candidateName,
            null, // Email not available in evaluation
            null, // WhatsApp not available in evaluation
            candidateLocation,
            null, // LinkedIn not available in evaluation
            currentDesignation,
            currentCompany,
            totalExpYears,
            numberOfCompanies,
          ]
        );

        const newCandidateId = candidateInsert.insertId;
        console.log('[candidates/fix-duplicates] Created new candidate:', {
          id: newCandidateId,
          name: candidateName,
        });

        // Update the evaluation to point to the new candidate
        await connection.execute(
          'UPDATE evaluations SET candidate_id = ? WHERE id = ?',
          [newCandidateId, evaluation.id]
        );

        fixedCandidates.push({
          evaluationId: evaluation.id,
          candidateId: newCandidateId,
          candidateName,
          action: 'created_new',
        });
      }

      await connection.commit();

      console.log('[candidates/fix-duplicates] ========== FIX COMPLETE ==========');
      console.log('[candidates/fix-duplicates] Fixed', fixedCandidates.length, 'candidates');

      return res.status(200).json({
        success: true,
        message: `Successfully fixed ${fixedCandidates.length} candidate(s)`,
        fixedCandidates,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.release();
    }
  } catch (error) {
    console.error('[candidates/fix-duplicates] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

