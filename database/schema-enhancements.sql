-- Enhanced Schema for Smarter Application Features
-- Run this after the base schema.sql

-- Add linkedInUrl to candidates table if not exists
-- Note: Run these manually if column doesn't exist
-- ALTER TABLE `candidates` ADD COLUMN `linkedin_url` VARCHAR(500) DEFAULT NULL AFTER `candidate_location`;
-- ALTER TABLE `candidates` ADD INDEX `idx_linkedin_url` (`linkedin_url`);

-- Activity Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_action` VARCHAR(100) NOT NULL,
  `entity_type` ENUM('candidate', 'evaluation', 'job_description', 'email', 'whatsapp', 'settings') NOT NULL,
  `entity_id` INT DEFAULT NULL,
  `action_details` JSON DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_action` (`user_action`),
  INDEX `idx_entity_type` (`entity_type`),
  INDEX `idx_entity_id` (`entity_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Candidate Notes Table (Internal Notes/Comments)
CREATE TABLE IF NOT EXISTS `candidate_notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidate_id` INT NOT NULL,
  `evaluation_id` INT DEFAULT NULL,
  `note_text` TEXT NOT NULL,
  `note_type` ENUM('general', 'interview', 'followup', 'rejection_reason', 'other') DEFAULT 'general',
  `is_important` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations`(`id`) ON DELETE SET NULL,
  INDEX `idx_candidate_id` (`candidate_id`),
  INDEX `idx_evaluation_id` (`evaluation_id`),
  INDEX `idx_note_type` (`note_type`),
  INDEX `idx_is_important` (`is_important`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Resume Files Table (Store Original Resume Files)
CREATE TABLE IF NOT EXISTS `resume_files` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidate_id` INT NOT NULL,
  `evaluation_id` INT DEFAULT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(50) DEFAULT NULL,
  `file_size` INT DEFAULT NULL,
  `file_path` VARCHAR(500) DEFAULT NULL,
  `file_hash` VARCHAR(64) DEFAULT NULL,
  `extracted_text` LONGTEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations`(`id`) ON DELETE SET NULL,
  INDEX `idx_candidate_id` (`candidate_id`),
  INDEX `idx_evaluation_id` (`evaluation_id`),
  INDEX `idx_file_hash` (`file_hash`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email/WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS `message_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `template_name` VARCHAR(255) NOT NULL,
  `template_type` ENUM('email', 'whatsapp') NOT NULL,
  `template_category` ENUM('shortlist', 'rejection', 'entry_level', 'interview', 'followup', 'custom') DEFAULT 'custom',
  `subject` VARCHAR(500) DEFAULT NULL,
  `body` TEXT NOT NULL,
  `variables` JSON DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_default` BOOLEAN DEFAULT FALSE,
  `usage_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_template_type` (`template_type`),
  INDEX `idx_template_category` (`template_category`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Candidate Tags Table (For Categorization)
CREATE TABLE IF NOT EXISTS `candidate_tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tag_name` VARCHAR(100) NOT NULL UNIQUE,
  `tag_color` VARCHAR(7) DEFAULT '#3B82F6',
  `tag_category` VARCHAR(50) DEFAULT NULL,
  `usage_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tag_name` (`tag_name`),
  INDEX `idx_tag_category` (`tag_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Candidate-Tag Mapping Table
CREATE TABLE IF NOT EXISTS `candidate_tag_mappings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidate_id` INT NOT NULL,
  `tag_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tag_id`) REFERENCES `candidate_tags`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_candidate_tag` (`candidate_id`, `tag_id`),
  INDEX `idx_candidate_id` (`candidate_id`),
  INDEX `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Search History Table (Track searches for analytics)
CREATE TABLE IF NOT EXISTS `search_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `search_type` ENUM('candidate', 'evaluation', 'job_description') NOT NULL,
  `search_query` VARCHAR(500) NOT NULL,
  `search_filters` JSON DEFAULT NULL,
  `results_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_search_type` (`search_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance Indexes (for better query performance)
-- Note: Run these manually if indexes don't exist (check first to avoid errors)
-- ALTER TABLE `candidates` ADD INDEX `idx_email_whatsapp` (`candidate_email`, `candidate_whatsapp`);
-- ALTER TABLE `evaluations` ADD INDEX `idx_role_verdict` (`role_applied`, `verdict`);
-- ALTER TABLE `evaluations` ADD INDEX `idx_score_date` (`match_score`, `created_at`);
-- ALTER TABLE `email_logs` ADD INDEX `idx_status_date` (`status`, `created_at`);
-- ALTER TABLE `whatsapp_logs` ADD INDEX `idx_status_date` (`status`, `created_at`);

-- Add last_contacted_at to candidates for follow-up tracking
-- ALTER TABLE `candidates` ADD COLUMN `last_contacted_at` TIMESTAMP NULL DEFAULT NULL AFTER `updated_at`;
-- ALTER TABLE `candidates` ADD INDEX `idx_last_contacted` (`last_contacted_at`);

-- Add status tracking to evaluations
-- ALTER TABLE `evaluations` ADD COLUMN `status` ENUM('evaluated', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'on_hold') DEFAULT 'evaluated' AFTER `verdict`;
-- ALTER TABLE `evaluations` ADD COLUMN `status_changed_at` TIMESTAMP NULL DEFAULT NULL AFTER `status`;
-- ALTER TABLE `evaluations` ADD INDEX `idx_status` (`status`);

