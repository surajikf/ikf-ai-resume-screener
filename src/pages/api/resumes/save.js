import { query, getConnection } from '@/lib/db';

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

    // Convert evaluationId to integer
    const evalId = parseInt(evaluationId, 10);
    if (isNaN(evalId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid evaluationId format',
      });
    }

    console.log('[resumes/save] Saving resume:', {
      evaluationId: evalId,
      fileName,
      fileType,
      fileSize,
      contentLength: fileContent?.length,
    });

    // Convert base64 to buffer - ensure valid base64 string
    let fileBuffer;
    try {
      // Remove data URL prefix if present (data:application/pdf;base64,...)
      let base64Data = fileContent.trim();
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1].trim();
      }
      
      // Validate base64 string (remove any whitespace/newlines)
      base64Data = base64Data.replace(/\s/g, '');
      
      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
        throw new Error('Invalid base64 format: contains invalid characters');
      }
      
      // Decode base64 to buffer
      fileBuffer = Buffer.from(base64Data, 'base64');
      
      if (fileBuffer.length === 0) {
        throw new Error('Decoded buffer is empty');
      }
      
      // Verify the decoded buffer is valid (not just padding)
      if (fileBuffer.length < 10) {
        throw new Error('Decoded file is too small to be valid');
      }
      
      console.log('[resumes/save] File buffer created:', {
        bufferLength: fileBuffer.length,
        expectedSize: fileSize,
        base64Length: base64Data.length,
      });
    } catch (bufferError) {
      console.error('[resumes/save] Buffer conversion error:', bufferError);
      return res.status(400).json({
        success: false,
        error: 'Invalid file content format',
        details: bufferError.message,
      });
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // Check if resume already exists for this evaluation
      const [existing] = await connection.execute(
        'SELECT id FROM resumes WHERE evaluation_id = ?',
        [evaluationId]
      );

      if (existing && existing.length > 0) {
        // Update existing resume
        console.log('[resumes/save] Updating existing resume');
        await connection.execute(
          `UPDATE resumes 
           SET file_name = ?, file_type = ?, file_size = ?, file_content = ?
           WHERE evaluation_id = ?`,
          [fileName, fileType || null, fileSize || null, fileBuffer, evalId]
        );
      } else {
        // Insert new resume
        console.log('[resumes/save] Inserting new resume');
        await connection.execute(
          `INSERT INTO resumes (evaluation_id, file_name, file_type, file_size, file_content)
           VALUES (?, ?, ?, ?, ?)`,
          [evalId, fileName, fileType || null, fileSize || null, fileBuffer]
        );
      }

      await connection.commit();
      connection.release();

      return res.status(200).json({
        success: true,
        message: 'Resume saved successfully',
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error saving resume:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save resume',
      details: error.message,
    });
  }
}
