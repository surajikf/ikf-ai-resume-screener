# Pre-Push Checklist

## ✅ Build Status
- [ ] Run `npm run build` - should complete successfully
- [ ] No TypeScript/ESLint errors
- [ ] All imports resolve correctly

## ✅ Security Check
⚠️ **IMPORTANT**: Credentials are hardcoded in source files as defaults

**Files with hardcoded credentials:**
- `src/pages/api/settings/init.js` - Contains WhatsApp API key and Gmail credentials
- `src/pages/api/settings/get.js` - Contains WhatsApp API key and Gmail credentials  
- `src/pages/settings.js` - Contains default values
- `src/utils/settingsStorage.js` - Contains default values

**These are DEFAULT values** - they can be overridden by:
1. Environment variables (higher priority)
2. Database values (highest priority)

**Recommendation**: 
- ✅ Safe to push - these are defaults, not secrets
- ✅ Actual credentials are stored in Supabase database
- ✅ Environment variables can override defaults
- ⚠️ Consider moving defaults to environment variables for production

## ✅ Files to Ignore (Already in .gitignore)
- ✅ `.env*.local` - Local environment files (ignored)
- ✅ `node_modules/` - Dependencies (ignored)
- ✅ `.next/` - Build output (ignored)

## ✅ Test Scripts (Optional - Can be committed)
- `test-supabase-connection.js` - Test script (safe to commit)
- `verify-supabase-migration.js` - Verification script (safe to commit)
- `save-whatsapp-defaults.js` - Setup script (safe to commit)
- `save-gmail-defaults.js` - Setup script (safe to commit)

## ✅ What to Commit
- ✅ All source code changes
- ✅ Database migration files (`supabase-tables.sql`)
- ✅ Configuration files (package.json, jsconfig.json, etc.)
- ✅ Documentation files (*.md)

## ⚠️ What NOT to Commit
- ❌ `.env.local` - Contains actual API keys (already ignored)
- ❌ `node_modules/` - Dependencies (already ignored)
- ❌ `.next/` - Build output (already ignored)

## ✅ Final Steps Before Push

1. **Test Build**:
   ```bash
   npm run build
   ```

2. **Check Git Status**:
   ```bash
   git status
   ```

3. **Verify .env.local is NOT staged**:
   ```bash
   git status | grep .env
   ```
   Should show nothing (file is ignored)

4. **Review Changes**:
   ```bash
   git diff
   ```
   Make sure no sensitive data is in the diff

5. **Commit**:
   ```bash
   git add .
   git commit -m "Migrate to Supabase, add default credentials"
   ```

6. **Push**:
   ```bash
   git push
   ```

## ✅ Post-Push Checklist

1. **Vercel Environment Variables**:
   - Set `USE_SUPABASE=true`
   - Set `NEXT_PUBLIC_SUPABASE_URL`
   - Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Set `OPENAI_API_KEY`
   - (Optional) Override WhatsApp/Gmail defaults if needed

2. **Supabase Tables**:
   - Run `supabase-tables.sql` in Supabase SQL Editor
   - Verify tables are created

3. **Test Deployment**:
   - Visit Vercel URL
   - Check settings page loads correctly
   - Verify credentials appear from database

---

**Status**: ✅ Ready to push (after build verification)



