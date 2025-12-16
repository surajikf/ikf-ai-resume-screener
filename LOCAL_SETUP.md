# Local Development Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies (if not already done)
```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory with the following:

#### Minimum Required Configuration:

**For AI Provider (Choose ONE):**

**Option A: Google Gemini (Recommended - FREE)**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-api-key-here
```
Get free API key: https://makersuite.google.com/app/apikey

**Option B: Groq (Fast - FREE)**
```env
AI_PROVIDER=groq
GROQ_API_KEY=your-api-key-here
```
Get free API key: https://console.groq.com/keys

**Option C: KIE AI (OpenAI-Compatible)**
```env
AI_PROVIDER=kie
KIE_API_KEY=your-api-key-here
KIE_MODEL=gpt-4o
```
Get API key: https://www.kie-ai.com/

**Option D: OpenAI (Paid)**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-api-key-here
```

#### Database Configuration:

**For Supabase (Recommended):**
```env
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**OR for MySQL:**
```env
USE_SUPABASE=false
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
```

### 3. Start the Development Server

```bash
npm run dev
```

The server will start on **http://localhost:3001**

### 4. Open in Browser

Navigate to: **http://localhost:3001**

---

## 📋 Complete .env.local Template

# AI Provider (Required - Choose ONE)
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here

# Alternative: KIE AI
# AI_PROVIDER=kie
# KIE_API_KEY=your-kie-api-key-here
# KIE_API_URL=https://api.kie.ai
# KIE_MODEL=gpt-4o

# Database (Required)
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Email Configuration
# GMAIL_CLIENT_ID=your-gmail-client-id
# GMAIL_CLIENT_SECRET=your-gmail-client-secret
# GMAIL_REDIRECT_URI=http://localhost:3001/api/gmail-oauth/callback

# Optional: WhatsApp Configuration
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

---

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created
- [ ] AI provider API key configured
- [ ] Database credentials configured
- [ ] Server starts without errors
- [ ] Can access http://localhost:3001

---

## 🐛 Troubleshooting

### Server won't start
- Check if port 3001 is already in use
- Verify all required environment variables are set
- Check console for error messages

### "Missing API key" error
- Ensure `AI_PROVIDER` matches the provider you configured
- Verify the API key is correct
- Restart the server after adding environment variables

### Database connection errors
- Verify database credentials are correct
- Check if database server is running
- For Supabase, ensure RLS policies are set up

---

## 📚 Additional Resources

- **Free AI Providers Setup**: See `FREE_AI_PROVIDERS_SETUP.md`
- **Supabase Setup**: See `SUPABASE_STORAGE_SETUP.md`
- **Database Setup**: See `DATABASE_SETUP.md`

