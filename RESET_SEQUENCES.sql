-- Run this SQL in Supabase SQL Editor to reset all ID sequences to start from 1
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- Reset candidates sequence (next ID will be 1)
SELECT setval('candidates_id_seq', 1, false);

-- Reset evaluations sequence (next ID will be 1)
SELECT setval('evaluations_id_seq', 1, false);

-- Reset resumes sequence (next ID will be 1)
SELECT setval('resumes_id_seq', 1, false);

-- Reset email_logs sequence (next ID will be 1)
SELECT setval('email_logs_id_seq', 1, false);

-- Reset whatsapp_logs sequence (next ID will be 1)
SELECT setval('whatsapp_logs_id_seq', 1, false);

-- Verify the reset worked (optional - check that next values are 1)
SELECT 
  'candidates_id_seq' as sequence_name,
  last_value,
  is_called,
  CASE WHEN is_called THEN last_value + 1 ELSE last_value END as next_value
FROM candidates_id_seq
UNION ALL
SELECT 
  'evaluations_id_seq' as sequence_name,
  last_value,
  is_called,
  CASE WHEN is_called THEN last_value + 1 ELSE last_value END as next_value
FROM evaluations_id_seq
UNION ALL
SELECT 
  'resumes_id_seq' as sequence_name,
  last_value,
  is_called,
  CASE WHEN is_called THEN last_value + 1 ELSE last_value END as next_value
FROM resumes_id_seq;
