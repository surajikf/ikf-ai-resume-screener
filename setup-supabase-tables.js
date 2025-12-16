// Automated Supabase Table Setup Script
// Run: node setup-supabase-tables.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Please make sure .env.local has:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL statements to create tables
const sqlStatements = [
  // Settings Table
  `CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE INDEX IF NOT EXISTS idx_setting_key ON settings(setting_key)`,

  // Job Descriptions Table
  `CREATE TABLE IF NOT EXISTS job_descriptions (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    jd_link VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_title ON job_descriptions(title)`,
  `CREATE INDEX IF NOT EXISTS idx_created_at ON job_descriptions(created_at)`,

  // Candidates Table
  `CREATE TABLE IF NOT EXISTS candidates (
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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_candidate_name ON candidates(candidate_name)`,
  `CREATE INDEX IF NOT EXISTS idx_candidate_email ON candidates(candidate_email)`,
  `CREATE INDEX IF NOT EXISTS idx_candidate_whatsapp ON candidates(candidate_whatsapp)`,

  // Evaluations Table
  `CREATE TABLE IF NOT EXISTS evaluations (
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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_candidate_id ON evaluations(candidate_id)`,
  `CREATE INDEX IF NOT EXISTS idx_job_description_id ON evaluations(job_description_id)`,
  `CREATE INDEX IF NOT EXISTS idx_verdict ON evaluations(verdict)`,
  `CREATE INDEX IF NOT EXISTS idx_match_score ON evaluations(match_score)`,

  // Email Logs Table
  `CREATE TABLE IF NOT EXISTS email_logs (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT DEFAULT NULL,
    sent_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_evaluation_id_email ON email_logs(evaluation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_status_email ON email_logs(status)`,

  // WhatsApp Logs Table
  `CREATE TABLE IF NOT EXISTS whatsapp_logs (
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
  )`,

  `CREATE INDEX IF NOT EXISTS idx_evaluation_id_whatsapp ON whatsapp_logs(evaluation_id)`,
  `CREATE INDEX IF NOT EXISTS idx_status_whatsapp ON whatsapp_logs(status)`,

  // Resumes Table
  `CREATE TABLE IF NOT EXISTS resumes (
    id BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) DEFAULT NULL,
    file_size INT DEFAULT NULL,
    file_content BYTEA NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_evaluation_id_resume ON resumes(evaluation_id)`,
];

// RLS Policies
const rlsPolicies = [
  `ALTER TABLE settings ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE candidates ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE resumes ENABLE ROW LEVEL SECURITY`,
  
  `DROP POLICY IF EXISTS "Allow all operations on settings" ON settings`,
  `CREATE POLICY "Allow all operations on settings" ON settings FOR ALL USING (true) WITH CHECK (true)`,
  
  `DROP POLICY IF EXISTS "Allow all operations on job_descriptions" ON job_descriptions`,
  `CREATE POLICY "Allow all operations on job_descriptions" ON job_descriptions FOR ALL USING (true) WITH CHECK (true)`,
  
  `DROP POLICY IF EXISTS "Allow all operations on candidates" ON candidates`,
  `CREATE POLICY "Allow all operations on candidates" ON candidates FOR ALL USING (true) WITH CHECK (true)`,
  
  `DROP POLICY IF EXISTS "Allow all operations on evaluations" ON evaluations`,
  `CREATE POLICY "Allow all operations on evaluations" ON evaluations FOR ALL USING (true) WITH CHECK (true)`,
  
  `DROP POLICY IF EXISTS "Allow all operations on email_logs" ON email_logs`,
  `CREATE POLICY "Allow all operations on email_logs" ON email_logs FOR ALL USING (true) WITH CHECK (true)`,
  
  `DROP POLICY IF EXISTS "Allow all operations on whatsapp_logs" ON whatsapp_logs`,
  `CREATE POLICY "Allow all operations on whatsapp_logs" ON whatsapp_logs FOR ALL USING (true) WITH CHECK (true)`,
  
  `DROP POLICY IF EXISTS "Allow all operations on resumes" ON resumes`,
  `CREATE POLICY "Allow all operations on resumes" ON resumes FOR ALL USING (true) WITH CHECK (true)`,
];

async function setupTables() {
  console.log('🚀 Starting Supabase table setup...\n');
  console.log('📋 This will create all required tables and indexes.\n');

  let successCount = 0;
  let errorCount = 0;

  // Execute table creation statements
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    try {
      // Note: Supabase JS client doesn't support raw SQL execution directly
      // We need to use the REST API or SQL Editor
      // For now, we'll check if tables exist and provide instructions
      console.log(`⏳ Statement ${i + 1}/${sqlStatements.length}: ${sql.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Error in statement ${i + 1}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n⚠️  Note: Supabase JS client cannot execute DDL (CREATE TABLE) statements directly.');
  console.log('📝 You need to run the SQL manually in Supabase SQL Editor.\n');
  console.log('📋 Steps:');
  console.log('1. Go to: https://supabase.com/dashboard/project/dmupuczbhsmfwqnrtajw');
  console.log('2. Click "SQL Editor" → "New Query"');
  console.log('3. Open the file: supabase-tables.sql');
  console.log('4. Copy ALL the SQL code');
  console.log('5. Paste into Supabase SQL Editor');
  console.log('6. Click "Run" (or Ctrl+Enter)\n');

  // Test connection and check if settings table exists
  console.log('🔍 Testing connection...');
  const { data, error } = await supabase.from('settings').select('id').limit(1);
  
  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      console.log('⚠️  Settings table does not exist yet.');
      console.log('✅ Connection is working! Just need to create tables.\n');
    } else {
      console.error('❌ Connection error:', error.message);
      console.log('\n💡 Make sure:');
      console.log('   - Your Supabase project is active');
      console.log('   - Environment variables are set correctly');
      console.log('   - You have internet connection\n');
    }
  } else {
    console.log('✅ Connection successful!');
    console.log('✅ Settings table exists!');
    console.log('🎉 Supabase is ready to use!\n');
  }

  // Try to insert a test record
  console.log('🧪 Testing write operation...');
  try {
    const { data: testData, error: testError } = await supabase
      .from('settings')
      .upsert({ 
        setting_key: 'setup_test', 
        setting_value: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
      }, { onConflict: 'setting_key' })
      .select();

    if (testError) {
      console.log('⚠️  Write test failed:', testError.message);
      console.log('   (This is normal if tables are not created yet)\n');
    } else {
      console.log('✅ Write test successful!');
      // Clean up
      await supabase.from('settings').delete().eq('setting_key', 'setup_test');
      console.log('✅ Test data cleaned up.\n');
    }
  } catch (err) {
    console.log('⚠️  Could not test write operation:', err.message);
  }

  console.log('📊 Summary:');
  console.log(`   ✅ Connection: ${error ? 'Failed' : 'Working'}`);
  console.log(`   📋 Tables: ${error ? 'Need to create' : 'Ready'}`);
  console.log('\n🎯 Next Steps:');
  console.log('   1. Run the SQL from supabase-tables.sql in Supabase SQL Editor');
  console.log('   2. Restart your dev server: npm run dev');
  console.log('   3. Test at: http://localhost:3001/settings\n');
}

setupTables().catch(console.error);


