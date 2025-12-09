# Database Tables Summary

## ✅ Existing Core Tables (6 tables)

1. **job_descriptions** - Stores job descriptions
   - id, title, description, jd_link, created_at, updated_at

2. **candidates** - Stores candidate information
   - id, candidate_name, candidate_email, candidate_whatsapp, candidate_location, created_at, updated_at

3. **evaluations** - Stores resume evaluations
   - id, candidate_id, job_description_id, role_applied, verdict, match_score, work_experience (JSON), etc.

4. **email_logs** - Logs all email sending attempts
   - id, evaluation_id, to_email, subject, body, status, error_message, sent_at

5. **whatsapp_logs** - Logs all WhatsApp message attempts
   - id, evaluation_id, to_whatsapp, message, status, error_message, message_id, conversation_id

6. **settings** - Stores application settings
   - id, setting_key, setting_value, created_at, updated_at

## ✅ New Enhanced Tables (7 tables)

7. **activity_logs** - Audit trail for all user actions
   - Tracks: user actions, entity types, IP addresses, timestamps
   - Use cases: Security, debugging, compliance

8. **candidate_notes** - Internal notes/comments on candidates
   - Tracks: notes, note types (interview, followup, etc.), importance flags
   - Use cases: Interview notes, follow-up reminders, internal communication

9. **resume_files** - Stores original resume files
   - Tracks: file name, type, size, path, hash, extracted text
   - Use cases: Resume storage, duplicate detection, file retrieval

10. **message_templates** - Email/WhatsApp templates
    - Tracks: template name, type, category, subject, body, variables, usage count
    - Use cases: Template management, A/B testing, customization

11. **candidate_tags** - Tags for candidate categorization
    - Tracks: tag name, color, category, usage count
    - Use cases: Organization, filtering, grouping

12. **candidate_tag_mappings** - Links candidates to tags
    - Many-to-many relationship between candidates and tags

13. **search_history** - Tracks search queries for analytics
    - Tracks: search type, query, filters, results count
    - Use cases: Analytics, improving search, user behavior

## 📊 Total: 13 Tables

## 🔧 Recommended Manual Additions

Run these SQL commands manually in phpMyAdmin if needed:

```sql
-- Add LinkedIn URL to candidates
ALTER TABLE `candidates` 
ADD COLUMN `linkedin_url` VARCHAR(500) DEFAULT NULL AFTER `candidate_location`;

ALTER TABLE `candidates` 
ADD INDEX `idx_linkedin_url` (`linkedin_url`);

-- Add last contacted tracking
ALTER TABLE `candidates`
ADD COLUMN `last_contacted_at` TIMESTAMP NULL DEFAULT NULL AFTER `updated_at`;

ALTER TABLE `candidates`
ADD INDEX `idx_last_contacted` (`last_contacted_at`);

-- Add status tracking to evaluations
ALTER TABLE `evaluations`
ADD COLUMN `status` ENUM('evaluated', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'on_hold') DEFAULT 'evaluated' AFTER `verdict`;

ALTER TABLE `evaluations`
ADD COLUMN `status_changed_at` TIMESTAMP NULL DEFAULT NULL AFTER `status`;

ALTER TABLE `evaluations`
ADD INDEX `idx_status` (`status`);

-- Performance indexes
ALTER TABLE `candidates` ADD INDEX `idx_email_whatsapp` (`candidate_email`, `candidate_whatsapp`);
ALTER TABLE `evaluations` ADD INDEX `idx_role_verdict` (`role_applied`, `verdict`);
ALTER TABLE `evaluations` ADD INDEX `idx_score_date` (`match_score`, `created_at`);
ALTER TABLE `email_logs` ADD INDEX `idx_status_date` (`status`, `created_at`);
ALTER TABLE `whatsapp_logs` ADD INDEX `idx_status_date` (`status`, `created_at`);
```

## 🎯 Features Enabled by New Tables

1. **Activity Logs**: Complete audit trail
2. **Candidate Notes**: Internal collaboration
3. **Resume Files**: Original file storage
4. **Message Templates**: Template management
5. **Tags**: Better organization
6. **Search History**: Analytics and improvements
7. **Status Tracking**: Pipeline management

## ✅ Database Connection Status

- **Status**: ✅ Connected
- **Host**: 192.168.2.100
- **Database**: db_IKF_AI_RESUME
- **Tables Created**: 13/13

