import { getConnection } from '@/lib/db';

/**
 * Smart duplicate detection with multiple matching strategies
 * Checks by email, WhatsApp, LinkedIn, and name (fuzzy)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { candidateName, candidateEmail, candidateWhatsApp, linkedInUrl } = req.query;

    if (!candidateName) {
      return res.status(400).json({
        success: false,
        error: 'Candidate name is required',
      });
    }

    const connection = await getConnection();

    try {
      let duplicateFound = null;
      let matchMethod = null;

      // Strategy 1: Match by email (most reliable)
      if (candidateEmail) {
        const [emailResults] = await connection.execute(
          `SELECT e.*, c.candidate_name, c.candidate_email, c.candidate_whatsapp
           FROM evaluations e
           INNER JOIN candidates c ON e.candidate_id = c.id
           WHERE c.candidate_email = ?
           ORDER BY e.created_at DESC
           LIMIT 1`,
          [candidateEmail]
        );
        
        if (emailResults.length > 0) {
          duplicateFound = emailResults[0];
          matchMethod = 'email';
        }
      }

      // Strategy 2: Match by WhatsApp (very reliable)
      if (!duplicateFound && candidateWhatsApp) {
        const [whatsappResults] = await connection.execute(
          `SELECT e.*, c.candidate_name, c.candidate_email, c.candidate_whatsapp
           FROM evaluations e
           INNER JOIN candidates c ON e.candidate_id = c.id
           WHERE c.candidate_whatsapp = ?
           ORDER BY e.created_at DESC
           LIMIT 1`,
          [candidateWhatsApp]
        );
        
        if (whatsappResults.length > 0) {
          duplicateFound = whatsappResults[0];
          matchMethod = 'whatsapp';
        }
      }

      // Strategy 3: Match by LinkedIn URL (reliable)
      if (!duplicateFound && linkedInUrl) {
        const [linkedinResults] = await connection.execute(
          `SELECT e.*, c.candidate_name, c.candidate_email, c.candidate_whatsapp
           FROM evaluations e
           INNER JOIN candidates c ON e.candidate_id = c.id
           WHERE c.linkedin_url = ?
           ORDER BY e.created_at DESC
           LIMIT 1`,
          [linkedInUrl]
        );
        
        if (linkedinResults.length > 0) {
          duplicateFound = linkedinResults[0];
          matchMethod = 'linkedin';
        }
      }

      // Strategy 4: Fuzzy name matching (less reliable)
      if (!duplicateFound) {
        const normalizedName = candidateName.trim().toLowerCase().replace(/\s+/g, ' ');
        const [nameResults] = await connection.execute(
          `SELECT e.*, c.candidate_name, c.candidate_email, c.candidate_whatsapp
           FROM evaluations e
           INNER JOIN candidates c ON e.candidate_id = c.id
           WHERE LOWER(TRIM(REPLACE(c.candidate_name, '  ', ' '))) = ?
           ORDER BY e.created_at DESC
           LIMIT 1`,
          [normalizedName]
        );
        
        if (nameResults.length > 0) {
          duplicateFound = nameResults[0];
          matchMethod = 'name';
        }
      }

      connection.release();

      if (!duplicateFound) {
        return res.status(200).json({
          success: true,
          isDuplicate: false,
          data: null,
          matchMethod: null,
        });
      }

      return res.status(200).json({
        success: true,
        isDuplicate: true,
        matchMethod,
        data: {
          candidateName: duplicateFound.candidate_name,
          candidateEmail: duplicateFound.candidate_email,
          candidateWhatsApp: duplicateFound.candidate_whatsapp,
          roleApplied: duplicateFound.role_applied,
          createdAt: duplicateFound.created_at,
          matchScore: duplicateFound.match_score,
          verdict: duplicateFound.verdict,
          evaluationId: duplicateFound.id,
        },
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check duplicate',
      details: error.message,
    });
  }
}

