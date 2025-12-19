import { query, getConnection } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const connection = await getConnection();
    
    try {
      // Check if table exists
      const [tables] = await connection.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'resumes'
      `);

      if (tables.length > 0) {
        connection.release();
        return res.status(200).json({
          success: true,
          message: 'Resumes table already exists',
          tableExists: true,
        });
      }

      // Create the table
      await connection.execute(`
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      connection.release();

      return res.status(200).json({
        success: true,
        message: 'Resumes table created successfully!',
        tableExists: true,
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating resumes table:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create resumes table',
      details: error.message,
    });
  }
}



