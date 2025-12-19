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

    // Start transaction
    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // Try to find existing JD by title (exact match first)
      const [exactMatch] = await connection.execute(
        'SELECT id, title, description, jd_link FROM job_descriptions WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) LIMIT 1',
        [title]
      );

      if (exactMatch.length > 0) {
        const existingJD = exactMatch[0];
        
        // Update JD link if provided and different
        if (jdLink && existingJD.jd_link !== jdLink) {
          await connection.execute(
            'UPDATE job_descriptions SET jd_link = ?, updated_at = NOW() WHERE id = ?',
            [jdLink, existingJD.id]
          );
          existingJD.jd_link = jdLink;
        }
        
        await connection.commit();
        
        return res.status(200).json({
          success: true,
          message: 'Job description found',
          data: {
            id: existingJD.id,
            title: existingJD.title,
            description: existingJD.description,
            jdLink: existingJD.jd_link,
            isNew: false,
          },
        });
      }

      // If not found, create new JD
      const [insertResult] = await connection.execute(
        'INSERT INTO job_descriptions (title, description, jd_link) VALUES (?, ?, ?)',
        [title, description, jdLink || null]
      );

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Job description created',
        data: {
          id: insertResult.insertId,
          title,
          description,
          jdLink: jdLink || null,
          isNew: true,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error finding/creating job description:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to find or create job description',
      details: error.message,
    });
  }
}

