# Quick Fix: Add file_path Column to Supabase

## ✅ Run This SQL in Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/dmupuczbhsmfwqnrtajw
2. Click on **SQL Editor** in the left sidebar
3. Copy and paste this SQL:

```sql
-- Add file_path column to resumes table
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS file_path VARCHAR(500) DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_file_path ON resumes(file_path);
```

4. Click **Run** (or press Ctrl+Enter)
5. You should see: "Success. No rows returned"

## ✅ That's It!

After running this:
- The error will disappear
- View Resume button will work
- Download Resume button will work
- New resumes will be saved to Supabase Storage

## Alternative: Use the SQL File

I've created `ADD_FILE_PATH_TO_SUPABASE.sql` - you can also run that file in Supabase SQL Editor.

