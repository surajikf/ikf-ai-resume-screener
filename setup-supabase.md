# Supabase Setup Instructions

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon) → **API**
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

## Step 2: Add Environment Variables

### For Local Development (.env.local):

Create or update `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
USE_SUPABASE=true

# Keep MySQL vars commented out (or remove them)
# DB_HOST=192.168.2.100
# DB_PORT=3306
# DB_NAME=db_IKF_AI_RESUME
# DB_USER=dbo_IKF_AI_RESUME
# DB_PASSWORD=Vxazm1)zRnR3Ocmm
```

### For Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these three variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
   - `USE_SUPABASE` = `true`

## Step 3: Create Tables in Supabase

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL below
4. Click **Run** (or press Ctrl+Enter)

```sql
-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_setting_key ON settings(setting_key);

-- Job Descriptions Table
CREATE TABLE IF NOT EXISTS job_descriptions (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  jd_link VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_title ON job_descriptions(title);
CREATE INDEX IF NOT EXISTS idx_created_at ON job_descriptions(created_at);

-- Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
  id BIGSERIAL PRIMARY KEY,
  candidate_name VARCHAR(255) NOT NULL,
  candidate_email VARCHAR(255) DEFAULT NULL,
  candidate_whatsapp VARCHAR(20) DEFAULT NULL,
  candidate_location VARCHAR(255) DEFAULT NULL,
  linkedin_url VARCHAR(500) DEFAULT NULL,
  current_designation VARCHAR(255) DEFAULT NULL,
  current_company VARCHAR(255) DEFAULT NULL,
  total_experience_years DECIMAL(4,2) DEFAULT NULL,
  number_of_companies INT DEFAULT NULL,
  profile_summary TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(candidate_email),
  UNIQUE(candidate_whatsapp)
);

CREATE INDEX IF NOT EXISTS idx_candidate_name ON candidates(candidate_name);
CREATE INDEX IF NOT EXISTS idx_candidate_email ON candidates(candidate_email);
CREATE INDEX IF NOT EXISTS idx_candidate_whatsapp ON candidates(candidate_whatsapp);

-- Evaluations Table
CREATE TABLE IF NOT EXISTS evaluations (
  id BIGSERIAL PRIMARY KEY,
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_description_id BIGINT DEFAULT NULL REFERENCES job_descriptions(id) ON DELETE SET NULL,
  role_applied VARCHAR(255) NOT NULL,
  company_location VARCHAR(255) DEFAULT NULL,
  experience_ctc_notice_location TEXT DEFAULT NULL,
  work_experience JSONB DEFAULT NULL,
  verdict VARCHAR(50) NOT NULL CHECK (verdict IN ('Recommended', 'Partially Suitable', 'Not Suitable')),
  match_score INT NOT NULL DEFAULT 0,
  score_breakdown JSONB DEFAULT NULL,
  key_strengths JSONB DEFAULT NULL,
  gaps JSONB DEFAULT NULL,
  education_gaps JSONB DEFAULT NULL,
  experience_gaps JSONB DEFAULT NULL,
  better_suited_focus TEXT DEFAULT NULL,
  email_draft JSONB DEFAULT NULL,
  whatsapp_draft JSONB DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_id ON evaluations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_description_id ON evaluations(job_description_id);
CREATE INDEX IF NOT EXISTS idx_verdict ON evaluations(verdict);
CREATE INDEX IF NOT EXISTS idx_match_score ON evaluations(match_score);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
  id BIGSERIAL PRIMARY KEY,
  evaluation_id BIGINT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT DEFAULT NULL,
  sent_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluation_id_email ON email_logs(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_status_email ON email_logs(status);

-- WhatsApp Logs Table
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id BIGSERIAL PRIMARY KEY,
  evaluation_id BIGINT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  to_whatsapp VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT DEFAULT NULL,
  message_id VARCHAR(255) DEFAULT NULL,
  conversation_id VARCHAR(255) DEFAULT NULL,
  sent_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluation_id_whatsapp ON whatsapp_logs(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_status_whatsapp ON whatsapp_logs(status);

-- Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
  id BIGSERIAL PRIMARY KEY,
  evaluation_id BIGINT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) DEFAULT NULL,
  file_size INT DEFAULT NULL,
  file_content BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluation_id_resume ON resumes(evaluation_id);
```

## Step 4: Test the Connection

After setting up:
1. Restart your dev server: `npm run dev`
2. Go to `/settings` page
3. Try saving some credentials
4. Click "Fetch from DB" - it should work!

## What You Need to Share:

Please provide:
1. **Project URL**: `https://xxxxx.supabase.co`
2. **Anon Key**: `eyJ...` (the long string)

Once you share these, I can help you:
- Set up the environment variables correctly
- Test the connection
- Migrate any existing data (if needed)


