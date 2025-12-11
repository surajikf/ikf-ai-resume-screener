import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get resume file from Supabase Storage
 * Returns the file as base64
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { evaluationId, filePath } = req.query;

    if (!evaluationId && !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: evaluationId or filePath',
      });
    }

    let path = filePath;

    // If evaluationId is provided, find the file path from database
    if (evaluationId && !filePath) {
      const evalId = parseInt(evaluationId, 10);
      if (isNaN(evalId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid evaluationId format',
        });
      }

      // Get file path from database
      const { query } = await import('@/lib/db');
      const result = await query(
        'SELECT file_path, file_name, file_type FROM resumes WHERE evaluation_id = ? LIMIT 1',
        [evalId]
      );

      if (!result.success || !result.data || result.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Resume not found for this evaluation',
          hint: 'Please re-evaluate the candidate to save the resume file.',
        });
      }

      path = result.data[0].file_path;
      if (!path) {
        return res.status(404).json({
          success: false,
          error: 'Resume file path not found in database',
        });
      }
    }

    console.log('[resumes/get-from-storage] Fetching file from storage:', path);

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(path);

    if (downloadError) {
      console.error('[resumes/get-from-storage] Download error:', downloadError);
      return res.status(404).json({
        success: false,
        error: 'File not found in storage',
        details: downloadError.message,
      });
    }

    // Convert Blob to Buffer then to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Content = buffer.toString('base64');

    // Get file metadata
    const { data: listData } = await supabase.storage
      .from('resumes')
      .list(path.split('/')[0], {
        search: path.split('/')[1],
      });

    const fileInfo = listData?.[0];

    console.log('[resumes/get-from-storage] ✅ File retrieved successfully:', {
      path,
      size: buffer.length,
      base64Length: base64Content.length,
    });

    return res.status(200).json({
      success: true,
      data: {
        fileName: fileInfo?.name || path.split('/').pop(),
        fileType: fileInfo?.metadata?.mimetype || 'application/pdf',
        fileSize: buffer.length,
        fileContent: base64Content,
        mimeType: fileInfo?.metadata?.mimetype || 'application/pdf',
      },
    });
  } catch (error) {
    console.error('[resumes/get-from-storage] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch resume from storage',
      details: error.message,
    });
  }
}

