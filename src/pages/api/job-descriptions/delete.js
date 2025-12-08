import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Job description ID is required',
      });
    }

    const result = await query(
      'DELETE FROM job_descriptions WHERE id = ?',
      [id]
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job description deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting job description:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete job description',
      details: error.message,
    });
  }
}

