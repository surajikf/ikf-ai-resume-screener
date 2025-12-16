/**
 * Script to save Gmail default credentials to Supabase
 * Run: node save-gmail-defaults.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
const envPath = join(__dirname, '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
} catch (err) {
  console.log('Warning: Could not read .env.local');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Gmail default credentials
const gmailDefaults = {
  gmailEmail: "careers@ikf.co.in",
  gmailAppPassword: "qellqgrcmusuypyy",
  emailSendingEnabled: false, // Keep disabled by default, user can enable
};

async function saveDefaults() {
  console.log('💾 Saving Gmail default credentials to Supabase...\n');
  
  const results = [];
  let allSuccess = true;
  
  for (const [key, value] of Object.entries(gmailDefaults)) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          setting_key: key,
          setting_value: JSON.stringify(value)
        }, { onConflict: 'setting_key' })
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Saved: ${key}`);
      results.push({ key, success: true });
    } catch (error) {
      console.error(`❌ Failed to save ${key}:`, error.message);
      results.push({ key, success: false, error: error.message });
      allSuccess = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  if (allSuccess) {
    console.log('✅ All Gmail credentials saved successfully!\n');
    console.log('📋 Next steps:');
    console.log('   1. Restart your dev server: npm run dev');
    console.log('   2. Go to http://localhost:3001/settings');
    console.log('   3. You should see Gmail Email and App Password pre-filled');
    console.log('   4. Click "Fetch from DB" to verify they load from database\n');
  } else {
    console.log('⚠️  Some credentials failed to save. Check errors above.\n');
  }
  
  return allSuccess;
}

saveDefaults().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});


