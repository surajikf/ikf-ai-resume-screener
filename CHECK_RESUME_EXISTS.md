# Check if Resume Exists in Database

## Quick Diagnostic

Open your browser console (F12) and check for these logs when clicking "View Resume":

1. `[ResumeViewer] Fetching resume for evaluationId: X`
2. `[ResumeViewer] Resume exists in database:` - Shows if resume is found
3. `[ResumeViewer] API Response:` - Shows what the API returned
4. `[resumes/get] Resume found:` - Shows resume data details

## If Resume Not Found

**The most common issue:** Old evaluations (created before we added resume saving) don't have resumes saved.

**Solution:** Re-evaluate the candidate to save the resume:
1. Go back to the main page
2. Upload the same resume file
3. Run evaluation again
4. The resume will be automatically saved this time
5. Then try viewing it again

## Test if Resume Exists

Visit this URL in your browser (replace X with the evaluation ID):
```
http://localhost:3001/api/resumes/test?evaluationId=X
```

This will show:
- If resume exists
- Storage type (Supabase Storage or BLOB)
- File size
- Content info

## Common Issues

1. **"Resume not found"** → Resume wasn't saved. Re-evaluate the candidate.
2. **"Failed to load PDF document"** → Resume exists but PDF viewer can't render it. Try the Download button instead.
3. **"Resume file content is missing"** → Resume record exists but file_content is null. Re-evaluate.

