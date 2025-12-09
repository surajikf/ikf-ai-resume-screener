import { query, testConnection } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Test connection first
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: connectionTest.message,
      });
    }

    // Create resumes table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`resumes\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`evaluation_id\` INT NOT NULL,
        \`file_name\` VARCHAR(255) NOT NULL,
        \`file_type\` VARCHAR(100) DEFAULT NULL,
        \`file_size\` INT DEFAULT NULL,
        \`file_content\` LONGBLOB NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`evaluation_id\`) REFERENCES \`evaluations\`(\`id\`) ON DELETE CASCADE,
        INDEX \`idx_evaluation_id\` (\`evaluation_id\`),
        INDEX \`idx_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    const result = await query(createTableSQL);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create resumes table',
        details: result.error,
      });
    }

    // Verify table was created
    const tablesCheck = await query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resumes'
    `);

    const tableExists = tablesCheck.success && tablesCheck.data.length > 0;

    return res.status(200).json({
      success: true,
      message: tableExists ? 'Resumes table created successfully' : 'Resumes table may not exist',
      tableExists,
    });
  } catch (error) {
    console.error('Error creating resumes table:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create resumes table',
      details: error.message,
    });
  }
}

