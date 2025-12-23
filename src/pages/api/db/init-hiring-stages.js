import { query } from '@/lib/db';

// Check if using Supabase
const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';

// This endpoint initializes the hiring stages database tables
// It can be called to ensure the tables exist before using the hiring pipeline feature
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // If using Supabase, redirect to Supabase-specific endpoint
  if (useSupabase) {
    // Import and call the Supabase handler
    const supabaseHandler = (await import('./init-hiring-stages-supabase')).default;
    return supabaseHandler(req, res);
  }

  try {
    const results = {
      candidate_stages_table: false,
      current_stage_column: false,
      current_stage_index: false,
      initialized_candidates: 0,
    };

    // 1. Create candidate_stages table
    try {
      const createTableResult = await query(
        `CREATE TABLE IF NOT EXISTS candidate_stages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          candidate_id INT NOT NULL,
          evaluation_id INT DEFAULT NULL,
          stage ENUM(
            'Applied/Received',
            'Screening/Review',
            'Shortlisted',
            'Interview Scheduled',
            'Interview Completed',
            'Offer Extended',
            'Offer Accepted',
            'Rejected',
            'On Hold'
          ) NOT NULL,
          comment TEXT DEFAULT NULL,
          changed_by VARCHAR(255) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
          FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE SET NULL,
          INDEX idx_candidate_id (candidate_id),
          INDEX idx_stage (stage),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      );
      results.candidate_stages_table = createTableResult.success;
    } catch (err) {
      console.error('Error creating candidate_stages table:', err);
      // Check if table already exists
      const checkTable = await query(`SHOW TABLES LIKE 'candidate_stages'`);
      results.candidate_stages_table = checkTable.success && checkTable.data?.length > 0;
    }

    // 2. Check and add current_stage column
    try {
      const checkColumn = await query(
        `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'candidates' 
         AND COLUMN_NAME = 'current_stage'`
      );

      if (checkColumn.success && checkColumn.data?.[0]?.count === 0) {
        // Column doesn't exist, add it
        const addColumnResult = await query(
          `ALTER TABLE candidates 
           ADD COLUMN current_stage ENUM(
             'Applied/Received',
             'Screening/Review',
             'Shortlisted',
             'Interview Scheduled',
             'Interview Completed',
             'Offer Extended',
             'Offer Accepted',
             'Rejected',
             'On Hold'
           ) DEFAULT 'Applied/Received'`
        );
        results.current_stage_column = addColumnResult.success;
      } else {
        results.current_stage_column = true; // Column already exists
      }
    } catch (err) {
      console.error('Error adding current_stage column:', err);
      // Check if column exists (might have been added already)
      const checkColumn = await query(
        `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'candidates' 
         AND COLUMN_NAME = 'current_stage'`
      );
      results.current_stage_column = checkColumn.success && checkColumn.data?.[0]?.count > 0;
    }

    // 3. Check and add index
    try {
      const checkIndex = await query(
        `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'candidates' 
         AND INDEX_NAME = 'idx_current_stage'`
      );

      if (checkIndex.success && checkIndex.data?.[0]?.count === 0) {
        const addIndexResult = await query(
          `ALTER TABLE candidates ADD INDEX idx_current_stage (current_stage)`
        );
        results.current_stage_index = addIndexResult.success;
      } else {
        results.current_stage_index = true; // Index already exists
      }
    } catch (err) {
      console.error('Error adding index:', err);
      results.current_stage_index = true; // Assume it exists or is not critical
    }

    // 4. Initialize existing candidates
    try {
      const initResult = await query(
        `UPDATE candidates 
         SET current_stage = 'Applied/Received' 
         WHERE current_stage IS NULL`
      );
      if (initResult.success) {
        // Get count of updated rows (MySQL doesn't return this directly, so we'll estimate)
        const countResult = await query(
          `SELECT COUNT(*) as count FROM candidates WHERE current_stage = 'Applied/Received'`
        );
        results.initialized_candidates = countResult.success ? (countResult.data?.[0]?.count || 0) : 0;
      }
    } catch (err) {
      console.error('Error initializing candidates:', err);
    }

    const allSuccess = results.candidate_stages_table && results.current_stage_column;

    return res.status(allSuccess ? 200 : 500).json({
      success: allSuccess,
      data: results,
      message: allSuccess 
        ? 'Hiring stages database initialized successfully' 
        : 'Some operations failed. Check the results for details.',
    });
  } catch (error) {
    console.error('Error initializing hiring stages:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize hiring stages database',
    });
  }
}

