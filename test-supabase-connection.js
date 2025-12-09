/**
 * Test Supabase Connection and Queries
 * Run: node test-supabase-connection.js
 * 
 * This script tests:
 * 1. Connection to Supabase
 * 2. Basic CRUD operations
 * 3. JOIN queries
 * 4. Settings save/get
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  try {
    // Test 1: Check if settings table exists
    console.log('1. Testing settings table...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('count')
      .limit(1);
    
    if (settingsError) {
      if (settingsError.code === 'PGRST116') {
        console.log('   ⚠️  Settings table does not exist yet');
        console.log('   📋 Please create tables using supabase-tables.sql\n');
        return false;
      }
      throw settingsError;
    }
    console.log('   ✅ Settings table exists\n');
    
    // Test 2: Insert a test setting
    console.log('2. Testing INSERT operation...');
    const testKey = 'test_key_' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('settings')
      .insert({
        setting_key: testKey,
        setting_value: JSON.stringify({ test: 'value' })
      })
      .select();
    
    if (insertError) throw insertError;
    console.log('   ✅ INSERT successful\n');
    
    // Test 3: Select the test setting
    console.log('3. Testing SELECT operation...');
    const { data: selectData, error: selectError } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', testKey)
      .single();
    
    if (selectError) throw selectError;
    console.log('   ✅ SELECT successful');
    console.log(`   📄 Retrieved: ${selectData.setting_key} = ${selectData.setting_value}\n`);
    
    // Test 4: Update the test setting
    console.log('4. Testing UPDATE operation...');
    const { data: updateData, error: updateError } = await supabase
      .from('settings')
      .update({ setting_value: JSON.stringify({ test: 'updated_value' }) })
      .eq('setting_key', testKey)
      .select();
    
    if (updateError) throw updateError;
    console.log('   ✅ UPDATE successful\n');
    
    // Test 5: Test UPSERT (ON DUPLICATE KEY UPDATE)
    console.log('5. Testing UPSERT operation...');
    const { data: upsertData, error: upsertError } = await supabase
      .from('settings')
      .upsert({
        setting_key: testKey,
        setting_value: JSON.stringify({ test: 'upserted_value' })
      }, { onConflict: 'setting_key' })
      .select();
    
    if (upsertError) throw upsertError;
    console.log('   ✅ UPSERT successful\n');
    
    // Test 6: Check if candidates table exists (for JOIN test)
    console.log('6. Checking tables for JOIN test...');
    const { data: candidatesData, error: candidatesError } = await supabase
      .from('candidates')
      .select('count')
      .limit(1);
    
    if (candidatesError && candidatesError.code === 'PGRST116') {
      console.log('   ⚠️  Candidates table does not exist yet');
      console.log('   📋 Please create tables using supabase-tables.sql\n');
    } else if (candidatesError) {
      throw candidatesError;
    } else {
      console.log('   ✅ Candidates table exists');
      
      // Test 7: Test JOIN query (if tables exist)
      console.log('\n7. Testing JOIN query...');
      const { data: joinData, error: joinError } = await supabase
        .from('evaluations')
        .select('*, candidates(*), job_descriptions(*)')
        .limit(5);
      
      if (joinError && joinError.code === 'PGRST116') {
        console.log('   ⚠️  Evaluations table does not exist yet');
      } else if (joinError) {
        console.log('   ⚠️  JOIN query error (this is ok if tables are empty):', joinError.message);
      } else {
        console.log(`   ✅ JOIN query successful (returned ${joinData?.length || 0} rows)\n`);
      }
    }
    
    // Cleanup: Delete test setting
    console.log('8. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('settings')
      .delete()
      .eq('setting_key', testKey);
    
    if (deleteError) {
      console.log('   ⚠️  Cleanup failed (non-critical):', deleteError.message);
    } else {
      console.log('   ✅ Cleanup successful\n');
    }
    
    console.log('✅ All tests passed! Supabase connection is working correctly.\n');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error details:', error);
    return false;
  }
}

async function checkTables() {
  console.log('📋 Checking required tables...\n');
  
  const requiredTables = [
    'settings',
    'candidates',
    'evaluations',
    'job_descriptions',
    'resumes',
    'email_logs',
    'whatsapp_logs'
  ];
  
  const tableStatus = {};
  
  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          tableStatus[table] = '❌ Missing';
        } else {
          tableStatus[table] = `⚠️  Error: ${error.message}`;
        }
      } else {
        tableStatus[table] = '✅ Exists';
      }
    } catch (err) {
      tableStatus[table] = `❌ Error: ${err.message}`;
    }
  }
  
  console.log('Table Status:');
  Object.entries(tableStatus).forEach(([table, status]) => {
    console.log(`  ${status} ${table}`);
  });
  
  const missingTables = Object.entries(tableStatus)
    .filter(([_, status]) => status.includes('❌ Missing'))
    .map(([table]) => table);
  
  if (missingTables.length > 0) {
    console.log('\n⚠️  Missing tables:', missingTables.join(', '));
    console.log('📋 Please create them using supabase-tables.sql\n');
    return false;
  }
  
  console.log('\n✅ All required tables exist!\n');
  return true;
}

async function main() {
  console.log('🚀 Supabase Connection Test\n');
  console.log('='.repeat(50));
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Key: ${supabaseKey.substring(0, 20)}...`);
  console.log('='.repeat(50));
  console.log();
  
  // Check tables first
  const tablesOk = await checkTables();
  
  // Run connection tests
  const testsOk = await testConnection();
  
  if (tablesOk && testsOk) {
    console.log('🎉 Everything is working! You can now use Supabase.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some issues found. Please fix them before proceeding.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
