import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Save resume file to Supabase Storage
 * Returns the public URL or path to the file
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { evaluationId, fileName, fileType, fileSize, fileContent } = req.body;

    if (!evaluationId || !fileName || !fileContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: evaluationId, fileName, fileContent',
      });
    }

    const evalId = parseInt(evaluationId, 10);
    if (isNaN(evalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid evaluationId format',
      });
    }

    console.log('[resumes/save-to-storage] Saving resume to Supabase Storage:', {
      evaluationId: evalId,
      fileName,
      fileType,
      fileSize,
      contentLength: fileContent?.length,
    });

    // Clean and validate base64
    let base64Data = String(fileContent).trim();
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1].trim();
    }
    base64Data = base64Data.replace(/\s/g, '');

    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid base64 format in file content',
      });
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(base64Data, 'base64');

    if (fileBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Decoded file buffer is empty',
      });
    }

    // Create unique file path: evaluationId/filename
    // Sanitize filename to prevent path traversal
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${evalId}/${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, fileBuffer, {
        contentType: fileType || 'application/pdf',
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('[resumes/save-to-storage] Upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload file to Supabase Storage',
        details: uploadError.message,
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);

    console.log('[resumes/save-to-storage] ✅ Resume uploaded successfully:', {
      path: filePath,
      publicUrl: urlData.publicUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'Resume saved to Supabase Storage successfully',
      data: {
        path: filePath,
        publicUrl: urlData.publicUrl,
        fileName: sanitizedFileName,
      },
    });
  } catch (error) {
    console.error('[resumes/save-to-storage] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save resume to storage',
      details: error.message,
    });
  }
}

