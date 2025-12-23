-- Migration: Add Hiring Stages Support
-- This migration adds support for tracking candidate progress through hiring pipeline
-- Run this migration to set up the database tables for hiring stages

-- Create candidate_stages table for full history
CREATE TABLE IF NOT EXISTS `candidate_stages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidate_id` INT NOT NULL,
  `evaluation_id` INT DEFAULT NULL, -- Optional: link to specific evaluation
  `stage` ENUM(
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
  `comment` TEXT DEFAULT NULL, -- Comment added when moving to this stage
  `changed_by` VARCHAR(255) DEFAULT NULL, -- HR person who made the change
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations`(`id`) ON DELETE SET NULL,
  INDEX `idx_candidate_id` (`candidate_id`),
  INDEX `idx_stage` (`stage`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add current_stage column to candidates table (MySQL doesn't support IF NOT EXISTS for ALTER TABLE)
-- Check if column exists first, if not add it
SET @dbname = DATABASE();
SET @tablename = 'candidates';
SET @columnname = 'current_stage';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(
    ''Applied/Received'',
    ''Screening/Review'',
    ''Shortlisted'',
    ''Interview Scheduled'',
    ''Interview Completed'',
    ''Offer Extended'',
    ''Offer Accepted'',
    ''Rejected'',
    ''On Hold''
  ) DEFAULT ''Applied/Received''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for current_stage (check if exists first)
SET @indexname = 'idx_current_stage';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD INDEX ', @indexname, ' (current_stage)')
));
PREPARE indexIfNotExists FROM @preparedStatement;
EXECUTE indexIfNotExists;
DEALLOCATE PREPARE indexIfNotExists;

-- Initialize existing candidates with 'Applied/Received' stage if current_stage is NULL
UPDATE `candidates` 
SET `current_stage` = 'Applied/Received' 
WHERE `current_stage` IS NULL;
