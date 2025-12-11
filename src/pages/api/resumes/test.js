import { query } from '@/lib/db';

// Test endpoint to verify resume save/retrieve flow
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { evaluationId } = req.query;

    if (!evaluationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing evaluationId parameter',
      });
    }

    const evalId = parseInt(evaluationId, 10);
    if (isNaN(evalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid evaluationId format',
      });
    }

    console.log('[resumes/test] Testing resume for evaluationId:', evalId);

    // Check if resume exists (handle Supabase - doesn't support LENGTH function)
    const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
    
    let result;
    try {
      if (useSupabase) {
        // For Supabase, don't use LENGTH() - get file_content separately if needed
        result = await query(
          'SELECT id, file_name, file_type, file_size, file_path FROM resumes WHERE evaluation_id = ? LIMIT 1',
          [evalId]
        );
      } else {
        // For MySQL, can use LENGTH()
        result = await query(
          'SELECT id, file_name, file_type, file_size, file_path, LENGTH(file_content) as content_length FROM resumes WHERE evaluation_id = ? LIMIT 1',
          [evalId]
        );
      }
    } catch (columnError) {
      // If file_path column doesn't exist, query without it
      if (columnError.message?.includes('file_path') || columnError.message?.includes('Unknown column')) {
        if (useSupabase) {
          result = await query(
            'SELECT id, file_name, file_type, file_size FROM resumes WHERE evaluation_id = ? LIMIT 1',
            [evalId]
          );
        } else {
          result = await query(
            'SELECT id, file_name, file_type, file_size, LENGTH(file_content) as content_length FROM resumes WHERE evaluation_id = ? LIMIT 1',
            [evalId]
          );
        }
      } else {
        throw columnError;
      }
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        details: result.error,
      });
    }

    if (!result.data || result.data.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No resume found for this evaluation',
        evaluationId: evalId,
        hint: 'The resume may not have been saved during evaluation. Please re-evaluate the candidate.',
      });
    }

    const resume = result.data[0];

    // Get actual file content to check format
    const contentResult = await query(
      'SELECT file_content FROM resumes WHERE evaluation_id = ? LIMIT 1',
      [evalId]
    );

    let contentInfo = {
      hasContent: false,
      contentType: 'unknown',
      isBuffer: false,
      length: 0,
    };

    if (contentResult.success && contentResult.data && contentResult.data.length > 0) {
      const fileContent = contentResult.data[0].file_content;
      contentInfo = {
        hasContent: !!fileContent,
        contentType: typeof fileContent,
        isBuffer: Buffer.isBuffer(fileContent),
        isArray: Array.isArray(fileContent),
        length: fileContent?.length || 0,
        firstBytes: fileContent 
          ? (Buffer.isBuffer(fileContent)
              ? fileContent.slice(0, 10).toString('hex')
              : typeof fileContent === 'string'
                ? fileContent.substring(0, 20)
                : 'unknown')
          : 'null',
      };
    }

    return res.status(200).json({
      success: true,
      message: 'Resume found in database',
      data: {
        id: resume.id,
        evaluationId: evalId,
        fileName: resume.file_name,
        fileType: resume.file_type,
        fileSize: resume.file_size,
        filePath: resume.file_path || null,
        storageType: resume.file_path ? 'Supabase Storage' : 'BLOB',
        contentLength: resume.content_length || contentInfo.length || null,
        contentInfo,
        note: resume.file_path === undefined ? 'file_path column not in database (needs migration)' : null,
      },
    });
  } catch (error) {
    console.error('[resumes/test] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message,
    });
  }
}

