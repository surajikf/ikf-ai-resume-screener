# Supabase Setup - Quick Start Guide

## ✅ Step 1: Create .env.local File

Create a file named `.env.local` in your project root (same folder as `package.json`) with this content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://dmupuczbhsmfwqnrtajw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdXB1Y3piaHNtZndxbnJ0YWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzgzODIsImV4cCI6MjA4MDg1NDM4Mn0.8Iy3HcB_EkOysV-ftBpUQ2mkWkcvQ6qwD_IZeGrpZuw
USE_SUPABASE=true
```

## ✅ Step 2: Create Tables in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `supabase-tables.sql` in this project
6. Copy ALL the SQL code
7. Paste it into the Supabase SQL Editor
8. Click **Run** (or press Ctrl+Enter)
9. You should see "Success. No rows returned" - that's good!

## ✅ Step 3: Add to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these 3 variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://dmupuczbhsmfwqnrtajw.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdXB1Y3piaHNtZndxbnJ0YWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzgzODIsImV4cCI6MjA4MDg1NDM4Mn0.8Iy3HcB_EkOysV-ftBpUQ2mkWkcvQ6qwD_IZeGrpZuw`
   - `USE_SUPABASE` = `true`
4. Redeploy your Vercel project

## ✅ Step 4: Test Locally

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Go to: http://localhost:3001/settings

3. Try saving some credentials (API Key, Company ID)

4. Click "Fetch from DB" - it should work!

## 🎉 Done!

Your app is now using Supabase instead of MySQL. You should see:
- No more "too many connections" errors
- Better performance
- Credentials saved and fetched from Supabase

## Troubleshooting

If you see errors:
1. Check that `.env.local` file exists and has the correct values
2. Verify tables were created in Supabase (check Table Editor)
3. Make sure you restarted the dev server after creating `.env.local`
4. Check browser console for any error messages



