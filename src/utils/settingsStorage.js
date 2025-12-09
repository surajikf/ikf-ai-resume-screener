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
    const data = await response.json();
    
    if (data.success && Object.keys(data.data).length > 0) {
      cachedDbSettings = data.data;
      cacheTimestamp = Date.now();
      // Also sync to localStorage as backup
      if (typeof window !== "undefined") {
        localStorage.setItem("ikfSettings", JSON.stringify(data.data));
      }
      return data.data;
    }
    return null;
  } catch (error) {
    console.log('Failed to load settings from database:', error);
    return null;
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

  // Save to database (async, don't wait)
  try {
    const response = await fetch('/api/settings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    
    if (response.ok) {
      console.log('Settings saved to database');
    }
  } catch (err) {
    console.log('Database save failed:', err);
  }
};

