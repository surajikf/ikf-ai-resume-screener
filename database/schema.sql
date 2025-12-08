-- IKF AI Resume Screener Database Schema
-- Database: db_IKF_AI_RESUME

-- Job Descriptions Table
CREATE TABLE IF NOT EXISTS `job_descriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `jd_link` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_title` (`title`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Candidates Table
CREATE TABLE IF NOT EXISTS `candidates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidate_name` VARCHAR(255) NOT NULL,
  `candidate_email` VARCHAR(255) DEFAULT NULL,
  `candidate_whatsapp` VARCHAR(20) DEFAULT NULL,
  `candidate_location` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_candidate_name` (`candidate_name`),
  INDEX `idx_candidate_email` (`candidate_email`),
  INDEX `idx_candidate_whatsapp` (`candidate_whatsapp`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Evaluations Table
CREATE TABLE IF NOT EXISTS `evaluations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidate_id` INT NOT NULL,
  `job_description_id` INT DEFAULT NULL,
  `role_applied` VARCHAR(255) NOT NULL,
  `company_location` VARCHAR(255) DEFAULT NULL,
  `experience_ctc_notice_location` TEXT DEFAULT NULL,
  `work_experience` JSON DEFAULT NULL,
  `verdict` ENUM('Recommended', 'Partially Suitable', 'Not Suitable') NOT NULL,
  `match_score` INT NOT NULL DEFAULT 0,
  `score_breakdown` JSON DEFAULT NULL,
  `key_strengths` JSON DEFAULT NULL,
  `gaps` JSON DEFAULT NULL,
  `education_gaps` JSON DEFAULT NULL,
  `experience_gaps` JSON DEFAULT NULL,
  `better_suited_focus` TEXT DEFAULT NULL,
  `email_draft` JSON DEFAULT NULL,
  `whatsapp_draft` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`job_description_id`) REFERENCES `job_descriptions`(`id`) ON DELETE SET NULL,
  INDEX `idx_candidate_id` (`candidate_id`),
  INDEX `idx_job_description_id` (`job_description_id`),
  INDEX `idx_verdict` (`verdict`),
  INDEX `idx_match_score` (`match_score`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Logs Table
CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `evaluation_id` INT NOT NULL,
  `to_email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(500) NOT NULL,
  `body` TEXT NOT NULL,
  `status` ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
  `error_message` TEXT DEFAULT NULL,
  `sent_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations`(`id`) ON DELETE CASCADE,
  INDEX `idx_evaluation_id` (`evaluation_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- WhatsApp Logs Table
CREATE TABLE IF NOT EXISTS `whatsapp_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `evaluation_id` INT NOT NULL,
  `to_whatsapp` VARCHAR(20) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
  `error_message` TEXT DEFAULT NULL,
  `message_id` VARCHAR(255) DEFAULT NULL,
  `conversation_id` VARCHAR(255) DEFAULT NULL,
  `sent_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations`(`id`) ON DELETE CASCADE,
  INDEX `idx_evaluation_id` (`evaluation_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings Table (for storing application settings)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for better performance (run these separately if tables already exist)
-- ALTER TABLE `candidates` ADD INDEX IF NOT EXISTS `idx_email_whatsapp` (`candidate_email`, `candidate_whatsapp`);
-- ALTER TABLE `evaluations` ADD INDEX IF NOT EXISTS `idx_role_verdict` (`role_applied`, `verdict`);
-- ALTER TABLE `evaluations` ADD INDEX IF NOT EXISTS `idx_score_date` (`match_score`, `created_at`);

