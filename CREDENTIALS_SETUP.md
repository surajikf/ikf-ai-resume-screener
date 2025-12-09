# Credentials Setup Guide

## Overview
All backend credentials (Email and WhatsApp) are now hardcoded as defaults and can be configured via:
1. **Environment Variables** (Recommended for Vercel)
2. **Database** (Editable via Settings page)
3. **Hardcoded defaults** (Fallback)

## How It Works

### Priority Order:
1. **Database values** (if saved via Settings page) - Highest priority
2. **Environment variables** (Vercel/Server) - Medium priority  
3. **Hardcoded defaults** (Code) - Fallback

### Current Hardcoded Defaults:
- **Phone Number ID**: `690875100784871` (hardcoded in code)
- **Template Name**: `resume_screener_message01` (hardcoded in code)
- **API URL**: `https://publicapi.myoperator.co/chat/messages` (hardcoded in code)

### Credentials That Need Environment Variables:

#### For Vercel Deployment:
Set these in Vercel Dashboard → Settings → Environment Variables:

**WhatsApp Credentials:**
- `WHATSAPP_API_KEY` - Your MyOperator API Key
- `WHATSAPP_COMPANY_ID` - Your MyOperator Company ID

**Email Credentials (Optional):**
- `GMAIL_EMAIL` - Gmail address
- `GMAIL_APP_PASSWORD` - Gmail app password
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GOOGLE_REFRESH_TOKEN` - Google OAuth Refresh Token
- `GOOGLE_SENDER_EMAIL` - Sender email address

#### For Local Development:
Create `.env.local` file in project root:
```
WHATSAPP_API_KEY=your_api_key_here
WHATSAPP_COMPANY_ID=your_company_id_here
GMAIL_EMAIL=your_email@example.com
GMAIL_APP_PASSWORD=your_app_password
```

## Settings Page

The Settings page now:
- ✅ Shows credentials as pre-filled (from database or hardcoded defaults)
- ✅ Allows editing and saving to database
- ✅ Displays indicators when credentials are configured
- ✅ Auto-saves changes to database

## Important Notes:

1. **Database Override**: Any credentials edited in the Settings page are saved to the database and will override environment variables.

2. **Vercel Environment Variables**: Set your credentials in Vercel's environment variables for production. These will be available by default.

3. **Local Development**: Use `.env.local` file for local development. This file is git-ignored.

4. **Security**: Never commit actual credentials to git. Always use environment variables or database storage.

