import { query } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // First, ensure table exists
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS \`job_descriptions\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`title\` VARCHAR(255) NOT NULL,
          \`description\` TEXT NOT NULL,
          \`jd_link\` VARCHAR(500) DEFAULT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (tableError) {
      console.error('[job-descriptions/list] Failed to create table:', tableError);
      // Continue anyway - table might already exist
    }

    const result = await query(
      'SELECT * FROM job_descriptions ORDER BY created_at DESC'
    );

    if (!result.success) {
      console.error('[job-descriptions/list] Query failed:', result.error);
      // Return empty array instead of 500 error - app can still work
      return res.status(200).json({
        success: true,
        data: [],
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
    // Return empty array instead of 500 error - app can still work
    return res.status(200).json({
      success: true,
      data: [],
      error: error.message,
    });
  }
}

