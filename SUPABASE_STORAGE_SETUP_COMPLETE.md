# Supabase Storage Setup - Complete Guide

## ✅ What You Need to Connect

To save resumes to your Supabase Storage bucket, you need these **3 things**:

### 1. Environment Variables

Add these to your `.env.local` file (or `.env`):

```env
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=https://dmupuczbhsmfwqnrtajw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Where to find these:**
- Go to: https://supabase.com/dashboard/project/dmupuczbhsmfwqnrtajw/settings/api
- **Project URL** = `NEXT_PUBLIC_SUPABASE_URL`
- **anon/public key** = `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Bucket Permissions

Your `resumes` bucket needs these policies. Go to:
https://supabase.com/dashboard/project/dmupuczbhsmfwqnrtajw/storage/policies

**Add these 4 policies:**

#### Policy 1: Allow authenticated uploads
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');
```

#### Policy 2: Allow public reads
```sql
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');
```

#### Policy 3: Allow authenticated updates
```sql
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'resumes');
```

#### Policy 4: Allow authenticated deletes
```sql
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'resumes');
```

### 3. Restart Your Server

After adding environment variables:
```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
```

## 🔍 How to Check if It's Working

### Step 1: Check Environment Variables

Create a test file `check-supabase-config.js`:

```javascript
console.log('USE_SUPABASE:', process.env.USE_SUPABASE);
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
```

### Step 2: Check Browser Console

When you evaluate a resume, check the browser console (F12) for:
- `[evaluations/save] Resume file check:` - Shows if resumeFile is received
- `✅ Resume saved to Supabase Storage:` - Success!
- `❌ Error saving resume:` - Shows the error

### Step 3: Check Server Logs

In your terminal where `npm run dev` is running, look for:
- `[evaluations/save] ✅ Resume saved to Supabase Storage:` - Success!
- `[evaluations/save] ⚠️ Supabase Storage save failed` - Check error message

## 🐛 Common Issues

### Issue 1: "Supabase Storage upload failed: new row violates row-level security policy"
**Solution:** Add the bucket policies above (Step 2)

### Issue 2: "Missing Supabase credentials"
**Solution:** Add environment variables (Step 1) and restart server

### Issue 3: "Bucket 'resumes' not found"
**Solution:** Make sure the bucket exists and is named exactly `resumes`

### Issue 4: Resumes still saving to BLOB
**Solution:** 
- Check `USE_SUPABASE=true` is set
- Check console logs to see why Storage save failed
- Check bucket permissions

## ✅ Quick Test

1. Add environment variables
2. Add bucket policies
3. Restart server
4. Evaluate a NEW resume
5. Check Supabase Storage dashboard - you should see files!

## 📝 Note

- **Old evaluations** won't have resumes in Storage (they're in BLOB)
- **New evaluations** will save to Storage (if configured correctly)
- The system falls back to BLOB if Storage fails (so it still works)

