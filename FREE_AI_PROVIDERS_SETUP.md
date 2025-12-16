# Free AI Providers Setup Guide

This application now supports multiple **FREE** AI providers for resume evaluation. You can switch between them easily!

## 🎯 Recommended: Google Gemini (Best Free Option)

**Why Gemini?**
- ✅ **Completely FREE** with generous limits (60 requests/min, 1,500/day)
- ✅ High quality responses (comparable to GPT-4)
- ✅ Fast response times
- ✅ Easy to set up

### Setup Steps:

1. **Get your free API key:**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the API key

2. **Add to `.env.local`:**
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your-api-key-here
   GEMINI_MODEL=gemini-1.5-flash  # or gemini-1.5-pro for better quality
   ```

3. **That's it!** Restart your dev server and you're ready to go.

---

## ⚡ Alternative: Groq (Very Fast)

**Why Groq?**
- ✅ **FREE tier available**
- ✅ Extremely fast inference (up to 10x faster than others)
- ✅ Good for production use

### Setup Steps:

1. **Get your free API key:**
   - Visit: https://console.groq.com/keys
   - Sign up for free account
   - Create an API key
   - Copy the API key

2. **Add to `.env.local`:**
   ```env
   AI_PROVIDER=groq
   GROQ_API_KEY=your-api-key-here
   GROQ_MODEL=llama-3.1-70b-versatile  # or mixtral-8x7b-32768
   ```

---

## 🤗 Alternative: Hugging Face (Open Source Models)

**Why Hugging Face?**
- ✅ **FREE tier available**
- ✅ Access to many open-source models
- ✅ Good for experimentation

### Setup Steps:

1. **Get your free API key:**
   - Visit: https://huggingface.co/settings/tokens
   - Sign up for free account
   - Create a new token (read access)
   - Copy the token

2. **Add to `.env.local`:**
   ```env
   AI_PROVIDER=huggingface
   HUGGINGFACE_API_KEY=your-token-here
   HUGGINGFACE_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct
   ```

---

## 🔑 Alternative: KIE AI (OpenAI-Compatible)

**Why KIE AI?**
- ✅ OpenAI-compatible API
- ✅ Access to GPT-4 and other models
- ✅ Simple integration

### Setup Steps:

1. **Get your API key:**
   - Visit: https://www.kie-ai.com/
   - Sign in to your account
   - Generate an API key from the API Key Management Page
   - Copy the API key

2. **Add to `.env.local`:**
   ```env
   AI_PROVIDER=kie
   KIE_API_KEY=your-api-key-here
   KIE_API_URL=https://api.kie.ai  # Optional: defaults to this
   KIE_MODEL=gpt-4o  # Adjust based on available models
   ```

**Note:** KIE AI uses an OpenAI-compatible API structure, so you can use models like `gpt-4o`, `gpt-4`, etc. Check KIE AI's documentation for available models.

---

## 💰 Paid Option: OpenAI (Original)

If you prefer to use OpenAI (paid):

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4o
```

---

## 🔄 Auto-Fallback

The system automatically falls back to Gemini if your primary provider fails (if Gemini API key is configured).

---

## 📊 Provider Comparison

| Provider | Free Tier | Speed | Quality | Best For |
|----------|-----------|-------|---------|----------|
| **Gemini** | ✅ 60 req/min, 1,500/day | Fast | High | **Recommended** |
| **Groq** | ✅ Available | Very Fast | Good | Production |
| **Hugging Face** | ✅ Available | Medium | Good | Experimentation |
| **KIE AI** | ⚠️ Check pricing | Fast | High | OpenAI alternative |
| **OpenAI** | ❌ Paid | Fast | Very High | Premium use |

---

## 🚀 Quick Start (Gemini - Recommended)

1. Get API key: https://makersuite.google.com/app/apikey
2. Add to `.env.local`:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your-key-here
   ```
3. Restart dev server: `npm run dev`
4. Done! 🎉

---

## 📝 Environment Variables Summary

```env
# Choose your provider: gemini, groq, huggingface, kie, or openai
AI_PROVIDER=gemini

# Gemini (Recommended - Free)
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-1.5-flash

# Groq (Fast - Free)
GROQ_API_KEY=your-key-here
GROQ_MODEL=llama-3.1-70b-versatile

# Hugging Face (Open Source - Free)
HUGGINGFACE_API_KEY=your-token-here
HUGGINGFACE_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct

# KIE AI (OpenAI-Compatible)
KIE_API_KEY=your-key-here
KIE_API_URL=https://api.kie.ai
KIE_MODEL=gpt-4o

# OpenAI (Paid)
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-4o
```

---

## ❓ Troubleshooting

**Error: "Missing API key"**
- Make sure you've added the correct API key for your chosen provider
- Check that `AI_PROVIDER` matches the provider you want to use
- Restart your dev server after adding environment variables

**Error: "Provider failed"**
- The system will auto-fallback to Gemini if configured
- Check your API key is valid
- Verify you haven't exceeded rate limits

**Want to switch providers?**
- Just change `AI_PROVIDER` in `.env.local` and restart the server
- No code changes needed!

