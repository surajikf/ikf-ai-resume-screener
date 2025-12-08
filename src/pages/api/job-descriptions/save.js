import { query, getConnection } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, description, jdLink } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required',
      });
    }

    const result = await query(
      'INSERT INTO job_descriptions (title, description, jd_link) VALUES (?, ?, ?)',
      [title, description, jdLink || null]
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job description saved successfully',
      data: {
        id: result.data.insertId,
        title,
      },
    });
  } catch (error) {
    console.error('Error saving job description:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save job description',
      details: error.message,
    });
  }
}

