-- Add file_path column to resumes table in Supabase
-- Run this SQL in Supabase SQL Editor

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' AND column_name = 'file_path'
  ) THEN
    ALTER TABLE resumes ADD COLUMN file_path VARCHAR(500) DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_file_path ON resumes(file_path);
    RAISE NOTICE 'file_path column added successfully';
  ELSE
    RAISE NOTICE 'file_path column already exists';
  END IF;
END $$;

