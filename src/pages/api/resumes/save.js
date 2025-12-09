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

    // Convert base64 to buffer
    let fileBuffer;
    try {
      fileBuffer = Buffer.from(fileContent, 'base64');
    } catch (bufferError) {
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
        await connection.execute(
          `UPDATE resumes 
           SET file_name = ?, file_type = ?, file_size = ?, file_content = ?
           WHERE evaluation_id = ?`,
          [fileName, fileType || null, fileSize || null, fileBuffer, evaluationId]
        );
      } else {
        // Insert new resume
        await connection.execute(
          `INSERT INTO resumes (evaluation_id, file_name, file_type, file_size, file_content)
           VALUES (?, ?, ?, ?, ?)`,
          [evaluationId, fileName, fileType || null, fileSize || null, fileBuffer]
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
