// Hardcoded credentials - available by default on Vercel and local
// These can be overridden by database values
// NOTE: For production, set these via Vercel environment variables
// For local development, you can hardcode them here or use .env.local
const DEFAULT_SETTINGS = {
  emailSignature: [
    "Best regards,",
    "Jahanvi Patel",
    "I Knowledge Factory Pvt. Ltd.",
    "📞 +91 9665079317",
  ].join("\n"),
  emailSendingEnabled: false,
  // Email Gmail API Credentials - hardcoded, can be overridden via database
  gmailEmail: process.env.GMAIL_EMAIL || "careers@ikf.co.in",
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD || "qellqgrcmusuypyy",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN || "",
  googleSenderEmail: process.env.GOOGLE_SENDER_EMAIL || "",
  // WhatsApp MyOperator API Credentials - hardcoded, can be overridden via database
  whatsappSendingEnabled: true,
  whatsappApiKey: process.env.WHATSAPP_API_KEY || "9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN",
  whatsappApiUrl: "https://publicapi.myoperator.co/chat/messages",
  whatsappPhoneNumberId: "8044186875", // Hardcoded default
  whatsappCompanyId: process.env.WHATSAPP_COMPANY_ID || "689044bc84f5e822",
  whatsappTemplateName: "resume_screener_message01", // Hardcoded default
  whatsappLanguage: "en",
};

// Cache for database settings to avoid repeated API calls
let cachedDbSettings = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60000; // 1 minute cache

// Get settings from database (async)
export const getSettingsFromDatabase = async () => {
  try {
    const response = await fetch('/api/settings/get');
    
    // Handle non-200 responses gracefully
    if (!response.ok) {
      console.log('Settings API returned non-200 status:', response.status);
      return DEFAULT_SETTINGS;
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Always return settings (either from DB or defaults)
      const settings = data.data || DEFAULT_SETTINGS;
      
      console.log('[settingsStorage] Received from API:', {
        hasApiKey: !!settings.whatsappApiKey && settings.whatsappApiKey !== "",
        hasCompanyId: !!settings.whatsappCompanyId && settings.whatsappCompanyId !== "",
        apiKeyLength: settings.whatsappApiKey?.length || 0,
        companyIdLength: settings.whatsappCompanyId?.length || 0,
        apiKeyPreview: settings.whatsappApiKey ? '***' + settings.whatsappApiKey.slice(-4) : 'empty',
        companyIdPreview: settings.whatsappCompanyId ? '***' + settings.whatsappCompanyId.slice(-4) : 'empty',
      });
      
      // If settings were just initialized, cache them
      if (Object.keys(settings).length > 0) {
        cachedDbSettings = settings;
        cacheTimestamp = Date.now();
        // Also sync to localStorage as backup
        if (typeof window !== "undefined") {
          localStorage.setItem("ikfSettings", JSON.stringify(settings));
        }
      }
      
      return settings;
    }
    
    // Fallback to defaults if API returns success: false
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.log('Failed to load settings from database:', error);
    // Return defaults on error - ensures app always works
    return DEFAULT_SETTINGS;
  }
};

// Get settings (sync - from cache/localStorage)
export const getSettings = () => {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };

  // Return cached database settings if available and fresh
  if (cachedDbSettings && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    // Merge: Use cached value if not empty, otherwise use default
    const merged = { ...DEFAULT_SETTINGS };
    for (const [key, value] of Object.entries(cachedDbSettings)) {
      if (value !== null && value !== undefined && value !== "") {
        merged[key] = value;
      }
    }
    return merged;
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem("ikfSettings");
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    // Merge: Use localStorage value if not empty, otherwise use default
    const merged = { ...DEFAULT_SETTINGS };
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== null && value !== undefined && value !== "") {
        merged[key] = value;
      }
    }
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

// Save settings to both database and localStorage
export const saveSettings = async (partialSettings) => {
  if (typeof window === "undefined") return;

  const current = getSettings();
  const next = {
    ...current,
    ...(partialSettings || {}),
  };

  // Save to localStorage immediately
  localStorage.setItem("ikfSettings", JSON.stringify(next));
  
  // Update cache
  cachedDbSettings = next;
  cacheTimestamp = Date.now();

  // Save to database (wait for it to complete to ensure persistence)
  try {
    const response = await fetch('/api/settings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    
    if (response.ok) {
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        const text = await response.text();
        console.error('Response text:', text);
        return; // Exit early if we can't parse
      }
      
      if (result.success) {
        console.log('Settings saved to database successfully', {
          savedCount: result.results?.filter(r => r.success).length || 0,
          totalCount: result.results?.length || 0,
        });
      } else {
        // Handle different error formats from API
        const errorMsg = result.error || result.errors?.join('; ') || result.details || result.message || 'Unknown error';
        console.error('Database save failed:', errorMsg);
        if (result.results) {
          const failedResults = result.results.filter(r => !r.success);
          if (failedResults.length > 0) {
            console.error('Failed settings:', failedResults);
          }
        }
      }
    } else {
      // Try to get error message from response
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.details || errorData.message || errorMsg;
      } catch {
        errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      }
      console.error('Database save failed with status:', errorMsg);
    }
  } catch (err) {
    console.error('Database save error:', err);
    // Don't throw - localStorage backup is already saved
  }
};

