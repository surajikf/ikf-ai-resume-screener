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
  whatsappPhoneNumberId: "690875100784871", // Hardcoded default - Phone Number ID (not phone number)
  whatsappCompanyId: process.env.WHATSAPP_COMPANY_ID || "689044bc84f5e822",
  whatsappTemplateName: "resume_screener_message01", // Hardcoded default
  whatsappLanguage: "en",
};

// Cache for database settings to avoid repeated API calls
let cachedDbSettings = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60000; // 1 minute cache

// Get settings from database (async) - ALWAYS use this for fresh database values
// This is the primary source of truth. Database values persist across deployments.
export const getSettingsFromDatabase = async (forceRefresh = false) => {
  try {
    // Clear cache if forcing refresh
    if (forceRefresh) {
      cachedDbSettings = null;
      cacheTimestamp = null;
    }
    
    const response = await fetch('/api/settings/get');
    
    // Handle non-200 responses gracefully
    if (!response.ok) {
      console.log('Settings API returned non-200 status:', response.status);
      // Try to use cached settings if available
      if (cachedDbSettings) {
        return cachedDbSettings;
      }
      return DEFAULT_SETTINGS;
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Database values are the source of truth - use them as-is
      // The API already merges with defaults, so we get complete settings
      const settings = data.data || DEFAULT_SETTINGS;
      
      console.log('[settingsStorage] Received from database:', {
        hasApiKey: !!settings.whatsappApiKey && settings.whatsappApiKey !== "",
        hasCompanyId: !!settings.whatsappCompanyId && settings.whatsappCompanyId !== "",
        apiKeyLength: settings.whatsappApiKey?.length || 0,
        companyIdLength: settings.whatsappCompanyId?.length || 0,
        apiKeyPreview: settings.whatsappApiKey ? '***' + settings.whatsappApiKey.slice(-4) : 'empty',
        companyIdPreview: settings.whatsappCompanyId ? '***' + settings.whatsappCompanyId.slice(-4) : 'empty',
        source: 'database',
      });
      
      // Always cache database settings (they persist across deployments)
      cachedDbSettings = settings;
      cacheTimestamp = Date.now();
      
      // Also sync to localStorage as backup (but database is primary)
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ikfSettings", JSON.stringify(settings));
        } catch (storageError) {
          console.warn('Failed to save to localStorage:', storageError);
        }
      }
      
      return settings;
    }
    
    // Fallback to cached settings if available, then defaults
    if (cachedDbSettings) {
      console.log('[settingsStorage] API returned success:false, using cached settings');
      return cachedDbSettings;
    }
    
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.log('Failed to load settings from database:', error);
    // Try cached settings first, then defaults
    if (cachedDbSettings) {
      console.log('[settingsStorage] Using cached settings due to error');
      return cachedDbSettings;
    }
    return DEFAULT_SETTINGS;
  }
};

// Get settings (sync - from cache/localStorage)
// NOTE: This is a fallback. Always prefer getSettingsFromDatabase() for fresh database values.
// This function is used for immediate access when async is not possible.
export const getSettings = () => {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };

  // Return cached database settings if available and fresh (preferred source)
  if (cachedDbSettings && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    // Database values take full precedence - don't merge with defaults
    // If a value exists in database (even if empty string), use it
    const merged = { ...DEFAULT_SETTINGS };
    for (const [key, value] of Object.entries(cachedDbSettings)) {
      // Use database value if it exists (including empty strings - user explicitly set it)
      if (value !== null && value !== undefined) {
        merged[key] = value;
      }
    }
    return merged;
  }

  // Fallback to localStorage (which should have been synced from database)
  try {
    const raw = localStorage.getItem("ikfSettings");
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    // Merge: Use localStorage value if not empty, otherwise use default
    const merged = { ...DEFAULT_SETTINGS };
    for (const [key, value] of Object.entries(parsed)) {
      // Use localStorage value if it exists (including empty strings)
      if (value !== null && value !== undefined) {
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

