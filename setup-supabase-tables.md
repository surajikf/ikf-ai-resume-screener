# Setup Supabase Tables - Step by Step Guide

## Quick Setup

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/dmupuczbhsmfwqnrtajw
   - Or: https://supabase.com/dashboard → Select your project

2. **Open SQL Editor**
   - Click on **"SQL Editor"** in the left sidebar
   - Click **"New Query"** button

3. **Copy SQL Schema**
   - Open `supabase-tables.sql` file in this project
   - Copy **ALL** the SQL content (Ctrl+A, Ctrl+C)

4. **Paste and Run**
   - Paste the SQL into the SQL Editor
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for "Success" message

5. **Verify Tables**
   - Go to **"Table Editor"** in the left sidebar
   - You should see these tables:
     - ✅ settings
     - ✅ candidates
     - ✅ evaluations
     - ✅ job_descriptions
     - ✅ resumes
     - ✅ email_logs
     - ✅ whatsapp_logs

## Detailed Steps with Screenshots

### Step 1: Access SQL Editor
```
Dashboard → SQL Editor → New Query
```

### Step 2: Copy SQL from File
The `supabase-tables.sql` file contains:
- CREATE TABLE statements for all tables
- Proper data types for PostgreSQL
- Foreign key relationships
- Indexes for performance

### Step 3: Run the SQL
After pasting, you should see:
```
Success. No rows returned
```

### Step 4: Verify Foreign Keys
After creating tables, verify foreign keys are set up:
1. Go to **Table Editor**
2. Click on **evaluations** table
3. Check that `candidate_id` has a foreign key to `candidates.id`
4. Check that `job_description_id` has a foreign key to `job_descriptions.id`

## Troubleshooting

### Error: "relation already exists"
- Tables already exist, this is OK
- You can drop and recreate if needed (be careful!)

### Error: "permission denied"
- Make sure you're using the correct Supabase project
- Check that you have admin access

### Error: "syntax error"
- Make sure you copied the entire SQL file
- Check for any missing semicolons
- Verify you're using PostgreSQL syntax (not MySQL)

## After Setup

1. **Test Connection**
   ```bash
   node test-supabase-connection.js
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```

3. **Test in Browser**
   - Go to: http://localhost:3001/settings
   - Check console for: `[db] Using Supabase database`
   - Try saving and fetching credentials

## Foreign Key Relationships

The following foreign keys should be automatically created:

1. **evaluations** → **candidates**
   - `evaluations.candidate_id` → `candidates.id`
   - ON DELETE CASCADE

2. **evaluations** → **job_descriptions**
   - `evaluations.job_description_id` → `job_descriptions.id`
   - ON DELETE SET NULL

3. **resumes** → **candidates**
   - `resumes.candidate_id` → `candidates.id`
   - ON DELETE CASCADE

## Next Steps

After tables are created:
1. ✅ Run `node test-supabase-connection.js` to verify
2. ✅ Start the dev server: `npm run dev`
3. ✅ Test saving settings in the UI
4. ✅ Deploy to Vercel with environment variables

