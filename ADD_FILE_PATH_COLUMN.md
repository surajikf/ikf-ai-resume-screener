# Fix: Add file_path Column to Resumes Table

## Quick Fix

The error "column resumes.file_path does not exist" means the database needs to be updated.

### Option 1: Run Migration Endpoint (Recommended)

Visit this URL in your browser or use curl:

```
http://localhost:3001/api/db/add-file-path-column
```

**Method: POST** (you can use a tool like Postman, or run this in terminal):

```bash
curl -X POST http://localhost:3001/api/db/add-file-path-column
```

### Option 2: Manual SQL (If using MySQL)

Run this SQL in your MySQL database:

```sql
ALTER TABLE resumes 
ADD COLUMN file_path VARCHAR(500) DEFAULT NULL 
COMMENT 'Path in Supabase Storage (e.g., evaluationId/filename.pdf)' 
AFTER file_size;

CREATE INDEX idx_file_path ON resumes(file_path);
```

### Option 3: If using Supabase PostgreSQL

Run this SQL in Supabase SQL Editor:

```sql
ALTER TABLE resumes 
ADD COLUMN file_path VARCHAR(500) DEFAULT NULL;

CREATE INDEX idx_file_path ON resumes(file_path);
```

## What This Does

- Adds `file_path` column to store Supabase Storage paths
- Makes the code backward compatible (works with or without the column)
- Allows future resumes to use Supabase Storage

## After Adding Column

1. The error will disappear
2. View Resume button will work
3. Download Resume button will work
4. New resumes will be saved to Supabase Storage (if configured)

## Note

The code now handles missing `file_path` column gracefully, so it will work even without this column. However, adding it enables Supabase Storage support for better performance.

