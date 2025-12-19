# Gmail Email Setup Guide

## Option 1: Gmail SMTP with App Password (Easiest - 5 minutes)

### Steps:
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" (if not enabled)
3. Click "App passwords" → Generate new
4. Select: Mail → Other → Name: "Resume Screener"
5. Copy the 16-character password
6. Enter in Settings: Email + App Password
7. Done! ✅

**Pros:** Works immediately, no OAuth setup
**Cons:** Requires 2-step verification enabled

---

## Option 2: Gmail API with OAuth2 (Better for Production)

### Your Credentials (Already Created):
- Client ID: `1016999992905-60298ij6g0qln710hhkc58ab9nke433b.apps.googleusercontent.com`
- Client Secret: `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`

### Get Refresh Token (Choose ONE method):

#### Method A: OAuth Playground (Recommended)
1. Go to: https://developers.google.com/oauthplayground/
2. Click ⚙️ gear icon → Check "Use your own OAuth credentials"
3. Enter your Client ID and Secret
4. In left panel: Find "Gmail API v1"
5. Select: `https://www.googleapis.com/auth/gmail.send`
6. Click "Authorize APIs" → Sign in
7. Click "Exchange authorization code for tokens"
8. Copy the "Refresh token"
9. Paste in Settings → Save

#### Method B: Fix Redirect URI (If Method A doesn't work)
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth client
3. Add to "Authorized redirect URIs":
   - `http://localhost:3001/api/gmail-oauth/callback`
   - `https://developers.google.com/oauthplayground` (for OAuth Playground)
4. Wait 5-10 minutes for changes to propagate
5. Try OAuth Playground again

#### Method C: Use Out-of-Band (OOB) Flow
If redirect URI issues persist, we can modify the code to use OOB flow.

### After Getting Refresh Token:
1. Enter in Settings:
   - Client ID: (already filled)
   - Client Secret: (already filled)
   - Refresh Token: (paste here)
   - Sender Email: `suraj.sonnar@ikf.co.in`
2. Save Settings
3. Done! ✅

**Pros:** More secure, no password needed, production-ready
**Cons:** Requires one-time OAuth setup

---

## Which Should You Use?

- **Quick Setup (Today):** Use App Password (Option 1)
- **Production/Long-term:** Use OAuth2 (Option 2)

Both methods work! The code supports both and will use whichever credentials you provide.



