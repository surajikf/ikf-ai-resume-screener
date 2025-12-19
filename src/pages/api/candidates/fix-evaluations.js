import { query, getConnection } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  if (req.method === 'GET' && req.query.confirm !== 'true') {
    return res.status(200).json({
      message: 'This endpoint will update the 2 most recent evaluations to point to the correct candidates.',
      instructions: 'To proceed, visit: /api/candidates/fix-evaluations?confirm=true',
    });
  }

  try {
    console.log('[candidates/fix-evaluations] ========== STARTING FIX ==========');
    
    // Get candidates 2 and 3
    const candidates = await query('SELECT id, candidate_name FROM candidates WHERE id IN (2, 3) ORDER BY id');
    
    if (!candidates.success || !Array.isArray(candidates.data) || candidates.data.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'Candidates 2 and 3 not found. Please run fix-duplicates first.',
      });
    }

    console.log('[candidates/fix-evaluations] Found candidates:', candidates.data);

    // Get the 2 most recent evaluations
    const recentEvals = await query(`
      SELECT id, candidate_id, created_at 
      FROM evaluations 
      WHERE candidate_id = 1 
      ORDER BY created_at DESC 
      LIMIT 2
    `);

    if (!recentEvals.success || !Array.isArray(recentEvals.data) || recentEvals.data.length < 2) {
      return res.status(200).json({
        success: false,
        message: 'Could not find 2 recent evaluations to fix',
      });
    }

    console.log('[candidates/fix-evaluations] Found evaluations to fix:', recentEvals.data);

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      const updates = [];
      
      // Match evaluations to candidates based on resume filenames
      for (let i = 0; i < Math.min(2, recentEvals.data.length); i++) {
        const evaluation = recentEvals.data[i];
        
        // Get resume filename
        const [resumeData] = await connection.execute(
          'SELECT file_name FROM resumes WHERE evaluation_id = ? LIMIT 1',
          [evaluation.id]
        );
        
        let candidateId = null;
        let candidateName = 'Unknown';
        
        if (resumeData.length > 0 && resumeData[0].file_name) {
          const fileName = resumeData[0].file_name;
          const nameWithoutExt = fileName.replace(/\.(pdf|docx|doc)$/i, '');
          const nameMatch = nameWithoutExt.match(/^([^[\]()_]+)/);
          
          if (nameMatch) {
            const extractedName = nameMatch[1].trim();
            
            // Find matching candidate - try exact match first, then partial
            for (const candidate of candidates.data) {
              const candidateNameClean = candidate.candidate_name?.replace(/-/g, ' ').toLowerCase() || '';
              const extractedNameClean = extractedName.replace(/-/g, ' ').toLowerCase();
              
              // Check if names match (exact or partial)
              if (candidateNameClean.includes(extractedNameClean) || 
                  extractedNameClean.includes(candidateNameClean) ||
                  candidate.candidate_name?.toLowerCase().includes(extractedName.toLowerCase()) ||
                  extractedName.toLowerCase().includes(candidate.candidate_name?.toLowerCase() || '')) {
                candidateId = candidate.id;
                candidateName = candidate.candidate_name;
                console.log('[candidates/fix-evaluations] Matched:', extractedName, '->', candidateName, '(id:', candidateId, ')');
                break;
              }
            }
            
            // If no match found, assign in order (first eval -> candidate 2, second eval -> candidate 3)
            if (!candidateId && candidates.data[i]) {
              candidateId = candidates.data[i].id;
              candidateName = candidates.data[i].candidate_name;
              console.log('[candidates/fix-evaluations] Assigned by order:', evaluation.id, '-> candidate', candidateId);
            }
          }
        }
        
        if (candidateId) {
          console.log('[candidates/fix-evaluations] Updating evaluation', evaluation.id, 'to candidate', candidateId);
          const [updateResult] = await connection.execute(
            'UPDATE evaluations SET candidate_id = ? WHERE id = ?',
            [candidateId, evaluation.id]
          );
          
          console.log('[candidates/fix-evaluations] Update result:', updateResult);
          
          updates.push({
            evaluationId: evaluation.id,
            oldCandidateId: evaluation.candidate_id,
            newCandidateId: candidateId,
            candidateName,
          });
        } else {
          console.warn('[candidates/fix-evaluations] Could not match evaluation', evaluation.id, 'to a candidate');
        }
      }

      await connection.commit();
      console.log('[candidates/fix-evaluations] ========== FIX COMPLETE ==========');

      return res.status(200).json({
        success: true,
        message: `Updated ${updates.length} evaluation(s)`,
        updates,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.release();
    }
  } catch (error) {
    console.error('[candidates/fix-evaluations] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

