// Verify Supabase Setup - Check all tables exist
// Run: node verify-supabase-setup.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'settings',
  'job_descriptions',
  'candidates',
  'evaluations',
  'email_logs',
  'whatsapp_logs',
  'resumes'
];

async function verifySetup() {
  console.log('🔍 Verifying Supabase setup...\n');
  
  const results = {
    connection: false,
    tables: {},
    writeTest: false,
    readTest: false,
  };

  // Test 1: Connection
  console.log('1️⃣  Testing connection...');
  try {
    const { data, error } = await supabase.from('settings').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    results.connection = true;
    console.log('   ✅ Connection successful!\n');
  } catch (error) {
    console.log('   ❌ Connection failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - Your Supabase project is active');
    console.log('   - Environment variables are correct');
    console.log('   - You have internet connection\n');
    return;
  }

  // Test 2: Check all tables
  console.log('2️⃣  Checking tables...');
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          results.tables[table] = false;
          console.log(`   ⚠️  ${table}: Not found`);
        } else {
          results.tables[table] = 'error';
          console.log(`   ❌ ${table}: Error - ${error.message}`);
        }
      } else {
        results.tables[table] = true;
        console.log(`   ✅ ${table}: Exists`);
      }
    } catch (err) {
      results.tables[table] = 'error';
      console.log(`   ❌ ${table}: ${err.message}`);
    }
  }
  console.log('');

  // Test 3: Write test
  console.log('3️⃣  Testing write operation...');
  try {
    const testKey = `test_${Date.now()}`;
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        setting_key: testKey,
        setting_value: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
      }, { onConflict: 'setting_key' })
      .select();

    if (error) {
      throw error;
    }
    results.writeTest = true;
    console.log('   ✅ Write test successful!');
    
    // Clean up
    await supabase.from('settings').delete().eq('setting_key', testKey);
    console.log('   ✅ Test data cleaned up\n');
  } catch (error) {
    console.log('   ❌ Write test failed:', error.message);
    console.log('');
  }

  // Test 4: Read test
  console.log('4️⃣  Testing read operation...');
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('setting_key, setting_value')
      .limit(5);

    if (error) {
      throw error;
    }
    results.readTest = true;
    console.log(`   ✅ Read test successful! (Found ${data?.length || 0} records)\n`);
  } catch (error) {
    console.log('   ❌ Read test failed:', error.message);
    console.log('');
  }

  // Summary
  console.log('📊 Setup Summary:');
  console.log(`   Connection: ${results.connection ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Write Test: ${results.writeTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Read Test: ${results.readTest ? '✅ Working' : '❌ Failed'}`);
  console.log('\n   Tables Status:');
  const allTablesExist = Object.values(results.tables).every(v => v === true);
  Object.entries(results.tables).forEach(([table, status]) => {
    const icon = status === true ? '✅' : status === false ? '⚠️' : '❌';
    console.log(`   ${icon} ${table}`);
  });

  console.log('\n' + '='.repeat(50));
  if (results.connection && results.writeTest && results.readTest && allTablesExist) {
    console.log('🎉 SUPABASE SETUP COMPLETE!');
    console.log('✅ All tables exist');
    console.log('✅ Connection working');
    console.log('✅ Read/Write operations working');
    console.log('\n🚀 You can now:');
    console.log('   1. Restart dev server: npm run dev');
    console.log('   2. Go to: http://localhost:3001/settings');
    console.log('   3. Save and fetch credentials - it will work!');
  } else if (results.connection && results.writeTest && results.readTest) {
    console.log('⚠️  SUPABASE PARTIALLY SETUP');
    console.log('✅ Connection and operations working');
    console.log('⚠️  Some tables are missing');
    console.log('\n📝 Next step:');
    console.log('   Run the SQL from supabase-tables.sql in Supabase SQL Editor');
  } else if (results.connection) {
    console.log('⚠️  CONNECTION WORKS BUT TABLES NEED SETUP');
    console.log('\n📝 Next step:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/dmupuczbhsmfwqnrtajw');
    console.log('   2. Click "SQL Editor" → "New Query"');
    console.log('   3. Copy ALL SQL from supabase-tables.sql');
    console.log('   4. Paste and click "Run"');
  } else {
    console.log('❌ SETUP INCOMPLETE');
    console.log('   Check your environment variables and Supabase project');
  }
  console.log('='.repeat(50) + '\n');
}

verifySetup().catch(console.error);



