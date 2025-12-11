import { query, getConnection } from '@/lib/db';

/**
 * Migration script to add file_path column to resumes table
 * This allows storing Supabase Storage paths alongside BLOB data
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const connection = await getConnection();
    
    try {
      // Check if column already exists
      const [columns] = await connection.execute(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'resumes' 
         AND COLUMN_NAME = 'file_path'`
      );
      
      if (columns && columns.length > 0) {
        connection.release();
        return res.status(200).json({
          success: true,
          message: 'file_path column already exists',
        });
      }
      
      // Add file_path column
      await connection.execute(
        `ALTER TABLE resumes 
         ADD COLUMN file_path VARCHAR(500) DEFAULT NULL 
         COMMENT 'Path in Supabase Storage (e.g., evaluationId/filename.pdf)' 
         AFTER file_size`
      );
      
      // Add index for faster lookups
      await connection.execute(
        `CREATE INDEX idx_file_path ON resumes(file_path)`
      );
      
      connection.release();
      
      return res.status(200).json({
        success: true,
        message: 'file_path column added successfully to resumes table',
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add file_path column',
      details: error.message,
    });
  }
}

