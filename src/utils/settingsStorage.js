const DEFAULT_SETTINGS = {
  emailSignature: [
    "Best regards,",
    "Jahanvi Patel",
    "I Knowledge Factory Pvt. Ltd.",
    "📞 +91 9665079317",
  ].join("\n"),
  emailSendingEnabled: false,
  gmailEmail: "",
  gmailAppPassword: "",
  googleClientId: "",
  googleClientSecret: "",
  googleRefreshToken: "",
  googleSenderEmail: "",
  whatsappSendingEnabled: true, // Default enabled
  whatsappApiKey: "",
  whatsappApiUrl: "https://publicapi.myoperator.co/chat/messages",
  whatsappPhoneNumberId: "690875100784871", // Default Phone Number ID from MyOperator
  whatsappCompanyId: "",
  whatsappTemplateName: "resume_screener_message01", // Default template name
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
    return {
      ...DEFAULT_SETTINGS,
      ...cachedDbSettings,
    };
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem("ikfSettings");
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...(parsed || {}),
    };
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
      const result = await response.json();
      if (result.success) {
        console.log('Settings saved to database successfully');
      } else {
        console.error('Database save failed:', result.error);
      }
    } else {
      console.error('Database save failed with status:', response.status);
    }
  } catch (err) {
    console.error('Database save error:', err);
    // Don't throw - localStorage backup is already saved
  }
};

