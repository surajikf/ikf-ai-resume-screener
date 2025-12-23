-- Supabase Migration: Add Hiring Stages Support
-- Run this in your Supabase SQL Editor to set up hiring stages

-- 1. Add current_stage column to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'Applied/Received';

-- Add check constraint to ensure valid stage values
ALTER TABLE candidates
ADD CONSTRAINT check_current_stage 
CHECK (current_stage IN (
  'Applied/Received',
  'Screening/Review',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Extended',
  'Offer Accepted',
  'Rejected',
  'On Hold'
));

-- 2. Create candidate_stages table for history
CREATE TABLE IF NOT EXISTS candidate_stages (
  id BIGSERIAL PRIMARY KEY,
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  evaluation_id BIGINT DEFAULT NULL REFERENCES evaluations(id) ON DELETE SET NULL,
  stage TEXT NOT NULL CHECK (stage IN (
    'Applied/Received',
    'Screening/Review',
    'Shortlisted',
    'Interview Scheduled',
    'Interview Completed',
    'Offer Extended',
    'Offer Accepted',
    'Rejected',
    'On Hold'
  )),
  comment TEXT DEFAULT NULL,
  changed_by VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidate_stages_candidate_id ON candidate_stages(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stages_stage ON candidate_stages(stage);
CREATE INDEX IF NOT EXISTS idx_candidate_stages_created_at ON candidate_stages(created_at);
CREATE INDEX IF NOT EXISTS idx_candidates_current_stage ON candidates(current_stage);

-- 4. Initialize existing candidates with 'Applied/Received' stage if current_stage is NULL
UPDATE candidates 
SET current_stage = 'Applied/Received' 
WHERE current_stage IS NULL;

