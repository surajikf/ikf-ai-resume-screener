/**
 * Verification script for Supabase migration
 * Run: node verify-supabase-migration.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Supabase Migration...\n');

const issues = [];
const checks = [];

// Check 1: Environment variables
console.log('1. Checking environment variables...');
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('SUPABASE_ANON_KEY');
  const hasUseSupabase = envContent.includes('USE_SUPABASE=true');
  
  checks.push({
    name: 'Environment variables',
    status: hasSupabaseUrl && hasSupabaseKey && hasUseSupabase,
    details: {
      hasUrl: hasSupabaseUrl,
      hasKey: hasSupabaseKey,
      hasFlag: hasUseSupabase
    }
  });
  
  if (!hasSupabaseUrl || !hasSupabaseKey || !hasUseSupabase) {
    issues.push('Missing required environment variables in .env.local');
  }
} else {
  issues.push('.env.local file not found');
  checks.push({ name: 'Environment variables', status: false });
}

// Check 2: Database adapter
console.log('2. Checking database adapter...');
const dbPath = path.join(__dirname, 'src/lib/db.js');
if (fs.existsSync(dbPath)) {
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  const hasSupabaseImport = dbContent.includes('db-supabase');
  const hasConditional = dbContent.includes('USE_SUPABASE');
  
  checks.push({
    name: 'Database adapter',
    status: hasSupabaseImport && hasConditional,
    details: { hasImport: hasSupabaseImport, hasConditional }
  });
  
  if (!hasSupabaseImport || !hasConditional) {
    issues.push('Database adapter not properly configured');
  }
} else {
  issues.push('Database adapter file not found');
  checks.push({ name: 'Database adapter', status: false });
}

// Check 3: Supabase implementation
console.log('3. Checking Supabase implementation...');
const supabasePath = path.join(__dirname, 'src/lib/db-supabase.js');
if (fs.existsSync(supabasePath)) {
  const supabaseContent = fs.readFileSync(supabasePath, 'utf8');
  const hasQuery = supabaseContent.includes('export async function query');
  const hasGetConnection = supabaseContent.includes('export async function getConnection');
  const hasTestConnection = supabaseContent.includes('export async function testConnection');
  const hasSelect = supabaseContent.includes('SELECT');
  const hasInsert = supabaseContent.includes('INSERT');
  const hasUpdate = supabaseContent.includes('UPDATE');
  const hasCount = supabaseContent.includes('COUNT');
  
  checks.push({
    name: 'Supabase implementation',
    status: hasQuery && hasGetConnection && hasTestConnection && hasSelect && hasInsert && hasUpdate && hasCount,
    details: {
      hasQuery,
      hasGetConnection,
      hasTestConnection,
      hasSelect,
      hasInsert,
      hasUpdate,
      hasCount
    }
  });
  
  if (!hasQuery || !hasGetConnection || !hasTestConnection) {
    issues.push('Supabase implementation missing required functions');
  }
} else {
  issues.push('Supabase implementation file not found');
  checks.push({ name: 'Supabase implementation', status: false });
}

// Check 4: Package dependencies
console.log('4. Checking package dependencies...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const hasSupabase = packageContent.dependencies && packageContent.dependencies['@supabase/supabase-js'];
  
  checks.push({
    name: 'Package dependencies',
    status: !!hasSupabase,
    details: { hasSupabase: !!hasSupabase, version: hasSupabase || 'not found' }
  });
  
  if (!hasSupabase) {
    issues.push('@supabase/supabase-js not in package.json dependencies');
  }
} else {
  issues.push('package.json not found');
  checks.push({ name: 'Package dependencies', status: false });
}

// Check 5: SQL schema file
console.log('5. Checking SQL schema file...');
const sqlPath = path.join(__dirname, 'supabase-tables.sql');
if (fs.existsSync(sqlPath)) {
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const hasSettings = sqlContent.includes('settings');
  const hasCandidates = sqlContent.includes('candidates');
  const hasEvaluations = sqlContent.includes('evaluations');
  const hasJobDescriptions = sqlContent.includes('job_descriptions');
  
  checks.push({
    name: 'SQL schema file',
    status: hasSettings && hasCandidates && hasEvaluations && hasJobDescriptions,
    details: {
      hasSettings,
      hasCandidates,
      hasEvaluations,
      hasJobDescriptions
    }
  });
  
  if (!hasSettings || !hasCandidates || !hasEvaluations || !hasJobDescriptions) {
    issues.push('SQL schema file missing required tables');
  }
} else {
  issues.push('supabase-tables.sql file not found');
  checks.push({ name: 'SQL schema file', status: false });
}

// Check 6: API routes using database
console.log('6. Checking API routes...');
const apiDir = path.join(__dirname, 'src/pages/api');
const criticalRoutes = [
  'settings/save.js',
  'settings/get.js',
  'evaluations/save.js',
  'evaluations/list.js',
  'candidates/find-or-create.js'
];

let allRoutesExist = true;
const routeDetails = {};

criticalRoutes.forEach(route => {
  const routePath = path.join(apiDir, route);
  const exists = fs.existsSync(routePath);
  routeDetails[route] = exists;
  if (!exists) {
    allRoutesExist = false;
    issues.push(`Critical API route missing: ${route}`);
  }
});

checks.push({
  name: 'API routes',
  status: allRoutesExist,
  details: routeDetails
});

// Summary
console.log('\n📊 Summary:\n');
checks.forEach(check => {
  const icon = check.status ? '✅' : '❌';
  console.log(`${icon} ${check.name}`);
  if (check.details) {
    Object.entries(check.details).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
  }
});

console.log('\n');

if (issues.length === 0) {
  console.log('✅ All checks passed! Migration looks good.\n');
  console.log('📋 Next steps:');
  console.log('   1. Create tables in Supabase using supabase-tables.sql');
  console.log('   2. Test the connection: npm run dev');
  console.log('   3. Visit http://localhost:3001/settings and test saving/fetching credentials');
  console.log('   4. Deploy to Vercel with environment variables set\n');
} else {
  console.log('⚠️  Issues found:\n');
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
  console.log('\n');
}

process.exit(issues.length === 0 ? 0 : 1);

