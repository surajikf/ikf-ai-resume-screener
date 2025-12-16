import { getConnection } from '@/lib/db';

/**
 * Smart candidate finder with multiple matching strategies
 * Priority: Email > WhatsApp > Name (fuzzy)
 */
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
      linkedInUrl,
      currentDesignation,
      currentCompany,
      totalExperienceYears,
      numberOfCompanies,
    } = req.body;

    if (!candidateName) {
      return res.status(400).json({
        success: false,
        error: 'Candidate name is required',
      });
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      let candidateId = null;
      let isNewCandidate = false;
      let matchMethod = null;

      // Strategy 1: Match by email (most reliable)
      if (candidateEmail) {
        const [emailResults] = await connection.execute(
          'SELECT id FROM candidates WHERE candidate_email = ? LIMIT 1',
          [candidateEmail]
        );
        
        if (emailResults.length > 0) {
          candidateId = emailResults[0].id;
          matchMethod = 'email';
        }
      }

      // Strategy 2: Match by WhatsApp (very reliable)
      if (!candidateId && candidateWhatsApp) {
        const [whatsappResults] = await connection.execute(
          'SELECT id FROM candidates WHERE candidate_whatsapp = ? LIMIT 1',
          [candidateWhatsApp]
        );
        
        if (whatsappResults.length > 0) {
          candidateId = whatsappResults[0].id;
          matchMethod = 'whatsapp';
        }
      }

      // Strategy 3: Match by LinkedIn URL (reliable)
      if (!candidateId && linkedInUrl) {
        const [linkedinResults] = await connection.execute(
          'SELECT id FROM candidates WHERE linkedin_url = ? LIMIT 1',
          [linkedInUrl]
        );
        
        if (linkedinResults.length > 0) {
          candidateId = linkedinResults[0].id;
          matchMethod = 'linkedin';
        }
      }

      // Strategy 4: Fuzzy name matching (less reliable, but useful)
      if (!candidateId) {
        // Normalize name for comparison (remove extra spaces, lowercase)
        const normalizedName = candidateName.trim().toLowerCase().replace(/\s+/g, ' ');
        
        const [nameResults] = await connection.execute(
          `SELECT id, candidate_name 
           FROM candidates 
           WHERE LOWER(TRIM(REPLACE(candidate_name, '  ', ' '))) = ? 
           LIMIT 1`,
          [normalizedName]
        );
        
        if (nameResults.length > 0) {
          candidateId = nameResults[0].id;
          matchMethod = 'name';
        }
      }

      // Update existing candidate or create new one
      if (candidateId) {
        // Update existing candidate with latest information
        await connection.execute(
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
            candidateName,
            candidateEmail || null,
            candidateWhatsApp || null,
            candidateLocation || null,
            linkedInUrl || null,
            currentDesignation || null,
            currentCompany || null,
            totalExperienceYears || null,
            numberOfCompanies || null,
            candidateId,
          ]
        );
      } else {
        // Create new candidate
        const [insertResult] = await connection.execute(
          `INSERT INTO candidates (
            candidate_name, candidate_email, candidate_whatsapp, candidate_location,
            linkedin_url, current_designation, current_company,
            total_experience_years, number_of_companies
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            candidateName,
            candidateEmail || null,
            candidateWhatsApp || null,
            candidateLocation || null,
            linkedInUrl || null,
            currentDesignation || null,
            currentCompany || null,
            totalExperienceYears || null,
            numberOfCompanies || null,
          ]
        );
        candidateId = insertResult.insertId;
        isNewCandidate = true;
        matchMethod = 'new';
      }

      await connection.commit();
      connection.release();

      return res.status(200).json({
        success: true,
        data: {
          candidateId,
          isNewCandidate,
          matchMethod,
        },
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error finding/creating candidate:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to find or create candidate',
      details: error.message,
    });
  }
}


