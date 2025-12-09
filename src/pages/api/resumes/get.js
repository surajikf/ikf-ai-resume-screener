import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { evaluationId } = req.query;

    if (!evaluationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: evaluationId',
      });
    }

    const result = await query(
      'SELECT file_name, file_type, file_size, file_content FROM resumes WHERE evaluation_id = ? LIMIT 1',
      [evaluationId]
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found for this evaluation',
      });
    }

    const resume = result.data[0];
    
    // Convert buffer to base64 for transmission
    const base64Content = resume.file_content.toString('base64');
    const mimeType = resume.file_type || 'application/pdf';

    return res.status(200).json({
      success: true,
      data: {
        fileName: resume.file_name,
        fileType: resume.file_type,
        fileSize: resume.file_size,
        fileContent: base64Content,
        mimeType: mimeType,
      },
    });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch resume',
      details: error.message,
    });
  }
}

