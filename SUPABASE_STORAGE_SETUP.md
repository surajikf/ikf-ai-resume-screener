# Supabase Storage Setup for Resumes

## ✅ What's Been Implemented

The application now supports **Supabase Storage** for storing resume files, which is much more efficient than storing BLOBs in the database.

## 📋 Setup Instructions

### 1. Create Storage Bucket (Already Done ✅)
You've already created the `resumes` bucket in Supabase. Great!

### 2. Configure Bucket Permissions

In your Supabase dashboard:
1. Go to **Storage** → **Policies**
2. For the `resumes` bucket, add these policies:

**Policy 1: Allow authenticated uploads**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');
```

**Policy 2: Allow public reads**
```sql
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');
```

**Policy 3: Allow authenticated updates**
```sql
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'resumes');
```

**Policy 4: Allow authenticated deletes**
```sql
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'resumes');
```

### 3. Run Database Migration

If you're using MySQL (not Supabase PostgreSQL), run this to add the `file_path` column:

```bash
# Visit this URL in your browser or use curl:
curl -X POST http://localhost:3001/api/db/add-file-path-column
```

Or visit: `http://localhost:3001/api/db/add-file-path-column` (POST request)

### 4. Verify Environment Variables

Make sure these are set:
- `USE_SUPABASE=true`
- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`

## 🔄 How It Works

### Saving Resumes
1. **Primary Method**: Files are saved to Supabase Storage bucket `resumes`
   - Path format: `{evaluationId}/{filename}`
   - Example: `123/Vaishali-Resume-2025.pdf`

2. **Fallback Method**: If Storage fails, files are saved as BLOB in database
   - This ensures compatibility with MySQL databases

### Retrieving Resumes
1. **First**: Check if `file_path` exists → Fetch from Supabase Storage
2. **Fallback**: If no `file_path` → Fetch from BLOB (`file_content`)

## 📁 File Structure

```
resumes/
├── 1/
│   └── Candidate-Name-Resume.pdf
├── 2/
│   └── Another-Resume.docx
└── 3/
    └── Third-Resume.pdf
```

## ✅ Benefits

1. **Better Performance**: Files stored in optimized storage, not database
2. **Scalability**: No database size limits for file storage
3. **Cost Effective**: Storage is cheaper than database storage
4. **CDN Ready**: Supabase Storage can be served via CDN
5. **Backward Compatible**: Still supports BLOB storage for MySQL

## 🧪 Testing

1. **Evaluate a new resume** - Check console for:
   - `✅ Resume saved to Supabase Storage` - Success!
   - `✅ Resume saved successfully to database (BLOB)` - Fallback used

2. **View a resume** - Check console for:
   - `✅ Resume retrieved from Supabase Storage` - Success!
   - Falls back to BLOB if Storage path doesn't exist

3. **Check Supabase Dashboard**:
   - Go to Storage → `resumes` bucket
   - You should see files organized by evaluation ID

## 🔧 Troubleshooting

### Issue: "Failed to upload file to Supabase Storage"
- **Solution**: Check bucket permissions (see step 2 above)
- **Solution**: Verify environment variables are set correctly

### Issue: "File not found in storage"
- **Solution**: Check if file was actually uploaded (check Supabase dashboard)
- **Solution**: Verify the `file_path` in database matches the actual path

### Issue: Still using BLOB storage
- **Solution**: Check if `USE_SUPABASE=true` is set
- **Solution**: Verify Supabase credentials are correct
- **Solution**: Check console logs for specific error messages

## 📝 Notes

- Old resumes (saved before this update) will still use BLOB storage
- New resumes will use Supabase Storage (if configured)
- The system automatically falls back to BLOB if Storage is unavailable
- Both methods work seamlessly - no data migration needed!

