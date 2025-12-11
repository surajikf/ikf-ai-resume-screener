# Resume Storage Fix Guide

This guide helps you diagnose and fix resume storage issues automatically.

## Quick Fix

If a resume is not displaying, run this in your browser console or use the API:

### Option 1: Use the Fix API (Recommended)

```javascript
// In browser console or Postman
fetch('/api/resumes/fix', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ evaluationId: 57 }) // Replace with your evaluation ID
})
.then(r => r.json())
.then(console.log);
```

### Option 2: Diagnose First

```javascript
// Check what's wrong
fetch('/api/resumes/diagnose?evaluationId=57&action=diagnose')
.then(r => r.json())
.then(console.log);
```

Then fix it:
```javascript
// Fix the issue
fetch('/api/resumes/diagnose?evaluationId=57&action=fix')
.then(r => r.json())
.then(console.log);
```

## What These Scripts Do

### `/api/resumes/diagnose`
- Checks if resume exists in database
- Checks if file exists in Supabase Storage
- Validates PDF headers
- Checks BLOB data
- Can automatically fix issues if `action=fix`

### `/api/resumes/fix`
- Reads BLOB from database
- Validates it's a proper PDF
- Re-uploads to Supabase Storage
- Updates database record with `file_path`

## Manual Steps

If the scripts don't work, you can:

1. **Re-evaluate the candidate** - This will save a fresh copy
2. **Check Supabase Storage** - Go to your Supabase dashboard and verify files exist
3. **Check database** - Verify `file_path` column exists and has values

## Common Issues

1. **"File appears to be corrupted"**
   - Run the fix script to re-upload from BLOB to Storage
   - Or re-evaluate the candidate

2. **"Storage retrieval failed"**
   - Check Supabase Storage bucket permissions
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly

3. **"No file_path in database"**
   - Run the fix script to create the file_path
   - Or re-evaluate the candidate

