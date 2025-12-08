import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await query(
      'SELECT * FROM job_descriptions ORDER BY created_at DESC'
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    const jobDescriptions = result.data.map(jd => ({
      id: jd.id,
      title: jd.title,
      content: jd.description,
      jdLink: jd.jd_link,
      createdAt: jd.created_at,
      updatedAt: jd.updated_at,
    }));

    return res.status(200).json({
      success: true,
      data: jobDescriptions,
    });
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch job descriptions',
      details: error.message,
    });
  }
}

