import { query } from '@/lib/db';

// Check if using Supabase (which doesn't support ALTER TABLE)
const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';

const VALID_STAGES = [
  'Applied/Received',
  'Screening/Review',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Extended',
  'Offer Accepted',
  'Rejected',
  'On Hold',
];

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Candidate ID is required' });
  }

  if (req.method === 'GET') {
    // Get current stage
    try {
      const result = await query(
        `SELECT current_stage FROM candidates WHERE id = ?`,
        [id]
      );

      if (!result.success || !result.data || result.data.length === 0) {
        return res.status(404).json({ success: false, error: 'Candidate not found' });
      }

      return res.status(200).json({
        success: true,
        data: {
          currentStage: result.data[0].current_stage || 'Applied/Received',
        },
      });
    } catch (error) {
      console.error('Error fetching candidate stage:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch candidate stage',
      });
    }
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    // Update stage
    try {
      const { stage, comment, evaluationId, changedBy } = req.body;

      if (!stage) {
        return res.status(400).json({ success: false, error: 'Stage is required' });
      }

      if (!VALID_STAGES.includes(stage)) {
        return res.status(400).json({
          success: false,
          error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`,
        });
      }

      // Validate comment is provided and not empty
      if (!comment || !comment.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Comment is required for stage changes. Please provide a reason for this stage transition.',
        });
      }

      // Verify candidate exists
      const candidateCheck = await query(
        `SELECT id FROM candidates WHERE id = ?`,
        [id]
      );

      if (!candidateCheck.success || !candidateCheck.data || candidateCheck.data.length === 0) {
        return res.status(404).json({ success: false, error: 'Candidate not found' });
      }

      // First, check if the column exists (for better error messages)
      let columnExists = true;
      if (useSupabase) {
        // For Supabase, try to select the column to check if it exists
        const checkResult = await query(
          `SELECT current_stage FROM candidates WHERE id = ? LIMIT 1`,
          [id]
        );
        if (!checkResult.success) {
          const checkError = String(checkResult.error || '');
          if (checkError.includes('column') || checkError.includes('does not exist') || checkError.includes('42703')) {
            columnExists = false;
          }
        }
      }

      // Try to update the stage
      let updateResult = await query(
        `UPDATE candidates SET current_stage = ? WHERE id = ?`,
        [stage, id]
      );

      if (!updateResult.success) {
        const errorMsg = String(updateResult.error || '');
        console.log('Update failed, error:', errorMsg);
        
        // Check if error is due to missing column
        const isColumnError = errorMsg.includes('Unknown column') || 
                             errorMsg.includes('current_stage') || 
                             errorMsg.includes("doesn't exist") ||
                             errorMsg.includes('column') ||
                             errorMsg.includes('42703') ||
                             !columnExists;
        
        if (isColumnError) {
          if (!useSupabase) {
            // MySQL: try to auto-create the column
            console.log('current_stage column not found, attempting to add it...');
            
            const alterResult = await query(
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
            
            if (!alterResult.success) {
              const alterError = String(alterResult.error || '');
              // If column already exists (duplicate column error), that's okay
              if (alterError.includes('Duplicate column') || alterError.includes('already exists')) {
                console.log('Column already exists, proceeding with update...');
              } else {
                console.error('Error adding current_stage column:', alterError);
                return res.status(500).json({
                  success: false,
                  error: `Database schema error: ${alterError}. Please run the migration: database/migrations/add-hiring-stages.sql`,
                });
              }
            }
            
            // Try update again
            updateResult = await query(
              `UPDATE candidates SET current_stage = ? WHERE id = ?`,
              [stage, id]
            );
            
            if (!updateResult.success) {
              console.error('Failed to update after adding column:', updateResult.error);
              return res.status(500).json({
                success: false,
                error: updateResult.error || 'Failed to update candidate stage after adding column',
              });
            }
          } else {
            // Supabase: can't auto-create, provide helpful error
            return res.status(500).json({
              success: false,
              error: 'Database schema not set up. The "current_stage" column is missing. Please run the Supabase migration script (database/migrations/supabase-hiring-stages.sql) in your Supabase SQL Editor. You can also check the setup by calling POST /api/db/init-hiring-stages-supabase',
              needsMigration: true,
            });
          }
        } else {
          // Different error - return it
          console.error('Update failed with error:', errorMsg);
          return res.status(500).json({
            success: false,
            error: errorMsg || 'Failed to update candidate stage',
          });
        }
      }

      // Insert into stage history
      if (!useSupabase) {
        // MySQL: auto-create table if needed
        try {
          const checkTable = await query(`SHOW TABLES LIKE 'candidate_stages'`);
          const tableExists = checkTable.success && checkTable.data?.length > 0;

          if (!tableExists) {
            console.log('Creating candidate_stages table...');
            await query(
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
          }

          const historyResult = await query(
            `INSERT INTO candidate_stages (candidate_id, evaluation_id, stage, comment, changed_by)
             VALUES (?, ?, ?, ?, ?)`,
            [id, evaluationId || null, stage, comment.trim(), changedBy || 'HR User']
          );

          if (!historyResult.success) {
            console.error('Failed to insert stage history:', historyResult.error);
          }
        } catch (err) {
          console.warn('Error inserting stage history:', err.message);
        }
      } else {
        // Supabase: try to insert (table must exist)
        try {
          const historyResult = await query(
            `INSERT INTO candidate_stages (candidate_id, evaluation_id, stage, comment, changed_by)
             VALUES (?, ?, ?, ?, ?)`,
            [id, evaluationId || null, stage, comment.trim(), changedBy || 'HR User']
          );

          if (!historyResult.success) {
            console.warn('Failed to insert stage history (table may not exist):', historyResult.error);
          }
        } catch (err) {
          console.warn('Error inserting stage history:', err.message);
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          currentStage: stage,
          message: 'Stage updated successfully',
        },
      });
    } catch (error) {
      console.error('Error updating candidate stage:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update candidate stage',
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
