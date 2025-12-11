# Easy Way to Create Supabase Storage Policies

## 🚀 Quick Method (Recommended)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/dmupuczbhsmfwqnrtajw/sql/new
2. Or click: **SQL Editor** in the left sidebar → **New Query**

### Step 2: Copy the SQL
Open the file `CREATE_STORAGE_POLICIES.sql` I just created, or copy this:

```sql
-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');

-- Policy 2: Allow public to read files (so resumes can be viewed)
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');

-- Policy 3: Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'resumes');

-- Policy 4: Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'resumes');
```

### Step 3: Paste and Run
1. Paste the SQL into the SQL Editor
2. Click **Run** (or press `Ctrl+Enter`)
3. You should see: "Success. No rows returned"

### Step 4: Verify
1. Go to: https://supabase.com/dashboard/project/dmupuczbhsmfwqnrtajw/storage/policies
2. You should see 4 new policies for the `resumes` bucket

## ✅ Done!

That's it! Now your bucket is ready to accept resume uploads.

---

## Alternative: Using Policy Builder (Visual Method)

If you prefer a visual interface:

### Step 1: Go to Storage Policies
1. Go to: https://supabase.com/dashboard/project/dmupuczbhsmfwqnrtajw/storage/policies
2. Find the `resumes` bucket
3. Click **"New Policy"**

### Step 2: Create Each Policy

**Policy 1 - Upload:**
- Policy name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'resumes'`
- WITH CHECK expression: `bucket_id = 'resumes'`

**Policy 2 - Read:**
- Policy name: `Allow public reads`
- Allowed operation: `SELECT`
- Target roles: `public`
- USING expression: `bucket_id = 'resumes'`

**Policy 3 - Update:**
- Policy name: `Allow authenticated updates`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'resumes'`

**Policy 4 - Delete:**
- Policy name: `Allow authenticated deletes`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'resumes'`

---

## 🎯 Quick Test

After creating policies:
1. Evaluate a new resume in your app
2. Check: https://supabase.com/dashboard/project/dmupuczbhsmfwqnrtajw/storage/files/buckets/resumes
3. You should see the resume file!

## ⚠️ If You Get Errors

**Error: "policy already exists"**
- That's OK! The policy is already there, skip it.

**Error: "relation storage.objects does not exist"**
- Make sure you're in the right project
- Try refreshing the page

**Error: "permission denied"**
- Make sure you're logged in as the project owner
- Check you have admin access

