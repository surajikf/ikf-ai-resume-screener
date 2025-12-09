import { query, testConnection } from '@/lib/db';
import fs from 'fs';
import path from 'path';

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

    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    let schemaSQL;
    
    try {
      schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    } catch (fileError) {
      // If file doesn't exist, use inline schema
      schemaSQL = `
-- Job Descriptions Table
CREATE TABLE IF NOT EXISTS \`job_descriptions\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`jd_link\` VARCHAR(500) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_title\` (\`title\`),
  INDEX \`idx_created_at\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Candidates Table (Enhanced with complete profile)
CREATE TABLE IF NOT EXISTS \`candidates\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`candidate_name\` VARCHAR(255) NOT NULL,
  \`candidate_email\` VARCHAR(255) DEFAULT NULL,
  \`candidate_whatsapp\` VARCHAR(20) DEFAULT NULL,
  \`candidate_location\` VARCHAR(255) DEFAULT NULL,
  \`linkedin_url\` VARCHAR(500) DEFAULT NULL,
  \`current_designation\` VARCHAR(255) DEFAULT NULL,
  \`current_company\` VARCHAR(255) DEFAULT NULL,
  \`total_experience_years\` DECIMAL(4,2) DEFAULT NULL,
  \`number_of_companies\` INT DEFAULT NULL,
  \`profile_summary\` TEXT DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY \`unique_email\` (\`candidate_email\`),
  UNIQUE KEY \`unique_whatsapp\` (\`candidate_whatsapp\`),
  INDEX \`idx_candidate_name\` (\`candidate_name\`),
  INDEX \`idx_candidate_email\` (\`candidate_email\`),
  INDEX \`idx_candidate_whatsapp\` (\`candidate_whatsapp\`),
  INDEX \`idx_candidate_location\` (\`candidate_location\`),
  INDEX \`idx_linkedin_url\` (\`linkedin_url\`(255)),
  INDEX \`idx_created_at\` (\`created_at\`),
  INDEX \`idx_name_email_whatsapp\` (\`candidate_name\`, \`candidate_email\`, \`candidate_whatsapp\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Evaluations Table
CREATE TABLE IF NOT EXISTS \`evaluations\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`candidate_id\` INT NOT NULL,
  \`job_description_id\` INT DEFAULT NULL,
  \`role_applied\` VARCHAR(255) NOT NULL,
  \`company_location\` VARCHAR(255) DEFAULT NULL,
  \`experience_ctc_notice_location\` TEXT DEFAULT NULL,
  \`work_experience\` JSON DEFAULT NULL,
  \`verdict\` ENUM('Recommended', 'Partially Suitable', 'Not Suitable') NOT NULL,
  \`match_score\` INT NOT NULL DEFAULT 0,
  \`score_breakdown\` JSON DEFAULT NULL,
  \`key_strengths\` JSON DEFAULT NULL,
  \`gaps\` JSON DEFAULT NULL,
  \`education_gaps\` JSON DEFAULT NULL,
  \`experience_gaps\` JSON DEFAULT NULL,
  \`better_suited_focus\` TEXT DEFAULT NULL,
  \`email_draft\` JSON DEFAULT NULL,
  \`whatsapp_draft\` JSON DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`candidate_id\`) REFERENCES \`candidates\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`job_description_id\`) REFERENCES \`job_descriptions\`(\`id\`) ON DELETE SET NULL,
  INDEX \`idx_candidate_id\` (\`candidate_id\`),
  INDEX \`idx_job_description_id\` (\`job_description_id\`),
  INDEX \`idx_verdict\` (\`verdict\`),
  INDEX \`idx_match_score\` (\`match_score\`),
  INDEX \`idx_created_at\` (\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Logs Table
CREATE TABLE IF NOT EXISTS \`email_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`evaluation_id\` INT NOT NULL,
  \`to_email\` VARCHAR(255) NOT NULL,
  \`subject\` VARCHAR(500) NOT NULL,
  \`body\` TEXT NOT NULL,
  \`status\` ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
  \`error_message\` TEXT DEFAULT NULL,
  \`sent_at\` TIMESTAMP NULL DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`evaluation_id\`) REFERENCES \`evaluations\`(\`id\`) ON DELETE CASCADE,
  INDEX \`idx_evaluation_id\` (\`evaluation_id\`),
  INDEX \`idx_status\` (\`status\`),
  INDEX \`idx_sent_at\` (\`sent_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- WhatsApp Logs Table
CREATE TABLE IF NOT EXISTS \`whatsapp_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`evaluation_id\` INT NOT NULL,
  \`to_whatsapp\` VARCHAR(20) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`status\` ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
  \`error_message\` TEXT DEFAULT NULL,
  \`message_id\` VARCHAR(255) DEFAULT NULL,
  \`conversation_id\` VARCHAR(255) DEFAULT NULL,
  \`sent_at\` TIMESTAMP NULL DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`evaluation_id\`) REFERENCES \`evaluations\`(\`id\`) ON DELETE CASCADE,
  INDEX \`idx_evaluation_id\` (\`evaluation_id\`),
  INDEX \`idx_status\` (\`status\`),
  INDEX \`idx_sent_at\` (\`sent_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings Table
CREATE TABLE IF NOT EXISTS \`settings\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`setting_key\` VARCHAR(100) NOT NULL UNIQUE,
  \`setting_value\` TEXT DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_setting_key\` (\`setting_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Resumes Table (for storing resume files)
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
    }

    // Split SQL into individual statements (remove comments and empty lines)
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    const results = [];
    const errors = [];

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const result = await query(statement);
          if (result.success) {
            results.push({ statement: statement.substring(0, 50) + '...', status: 'success' });
          } else {
            errors.push({ statement: statement.substring(0, 50) + '...', error: result.error });
          }
        } catch (err) {
          // Ignore "table already exists" errors
          if (err.message && err.message.includes('already exists')) {
            results.push({ statement: statement.substring(0, 50) + '...', status: 'already exists' });
          } else {
            errors.push({ statement: statement.substring(0, 50) + '...', error: err.message });
          }
        }
      }
    }

    // Verify tables were created
    const tablesCheck = await query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);

    const createdTables = tablesCheck.success ? tablesCheck.data.map(t => t.TABLE_NAME) : [];

    return res.status(200).json({
      success: true,
      message: 'Database tables created successfully',
      results,
      errors: errors.length > 0 ? errors : undefined,
      tables: createdTables,
      tableCount: createdTables.length,
    });
  } catch (error) {
    console.error('Schema initialization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create database tables',
      details: error.message,
    });
  }
}

