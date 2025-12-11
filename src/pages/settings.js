import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { Inter } from "next/font/google";
import { getSettings, saveSettings, getSettingsFromDatabase } from "@/utils/settingsStorage";
import { FaEnvelope, FaSignature, FaCheckCircle, FaInfoCircle, FaLock, FaArrowLeft, FaWhatsapp, FaPhone, FaGlobe, FaSave, FaSync } from "react-icons/fa";

const inter = Inter({ subsets: ["latin"] });

export default function SettingsPage() {
  const [emailSignature, setEmailSignature] = useState("");
  const [emailSendingEnabled, setEmailSendingEnabled] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("careers@ikf.co.in");
  const [gmailAppPassword, setGmailAppPassword] = useState("qellqgrcmusuypyy");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");
  const [googleSenderEmail, setGoogleSenderEmail] = useState("");
  const [whatsappSendingEnabled, setWhatsappSendingEnabled] = useState(true);
  const [whatsappApiKey, setWhatsappApiKey] = useState("9oAlpAhPvkKOGwuo6LiU8CPyRPxXSDoRVq1PFD0tkN");
  const [whatsappApiUrl, setWhatsappApiUrl] = useState("https://publicapi.myoperator.co/chat/messages");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("690875100784871");
  const [whatsappCompanyId, setWhatsappCompanyId] = useState("689044bc84f5e822");
  const [whatsappTemplateName, setWhatsappTemplateName] = useState("resume_screener_message01");
  const [whatsappLanguage, setWhatsappLanguage] = useState("en");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false); // For fetching from database
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false); // Start disabled until settings are loaded
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [loadedFromDb, setLoadedFromDb] = useState(false); // Track if settings were loaded from database
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Load settings from database - ALWAYS load fresh from database
    // Database settings persist across Git pushes and Vercel deployments
    const loadSettings = async () => {
      // Initialize defaults in database if they don't exist (silent, don't wait)
      try {
        await fetch('/api/settings/init', { method: 'POST' });
      } catch (err) {
        console.log('Settings init check failed:', err);
      }
      
      // ALWAYS load fresh settings from database (force refresh to get latest)
      // This ensures credentials saved previously are always shown
      const dbSettings = await getSettingsFromDatabase(true);
      const defaults = getSettings();
      const current = dbSettings || defaults;
      
      // Check if we have database settings (not just defaults)
      const hasDbSettings = dbSettings && Object.keys(dbSettings).length > 0;
      setLoadedFromDb(hasDbSettings);
      
      // Check if API Key and Company ID are specifically from database
      const apiKeyInDb = dbSettings?.whatsappApiKey && dbSettings.whatsappApiKey !== "";
      const companyIdInDb = dbSettings?.whatsappCompanyId && dbSettings.whatsappCompanyId !== "";
      
      console.log('[Settings] Loaded from database:', {
        hasDbSettings: !!dbSettings,
        loadedFromDb: hasDbSettings,
        apiKeyInDb: apiKeyInDb,
        apiKeyFromDb: apiKeyInDb ? '***' + dbSettings.whatsappApiKey.slice(-4) : 'not in DB',
        apiKeyLength: dbSettings?.whatsappApiKey?.length || 0,
        companyIdInDb: companyIdInDb,
        companyIdFromDb: companyIdInDb ? '***' + dbSettings.whatsappCompanyId.slice(-4) : 'not in DB',
        companyIdLength: dbSettings?.whatsappCompanyId?.length || 0,
        hasGmailEmail: !!current.gmailEmail,
        hasGmailPassword: !!current.gmailAppPassword,
        allDbKeys: dbSettings ? Object.keys(dbSettings) : [],
      });
      
      setEmailSignature(current.emailSignature || defaults.emailSignature || "");
      setEmailSendingEnabled(current.emailSendingEnabled !== undefined ? current.emailSendingEnabled : defaults.emailSendingEnabled);
      setGmailEmail(current.gmailEmail || "");
      setGmailAppPassword(current.gmailAppPassword || "");
      setGoogleClientId(current.googleClientId || "");
      setGoogleClientSecret(current.googleClientSecret || "");
      setGoogleRefreshToken(current.googleRefreshToken || "");
      setGoogleSenderEmail(current.googleSenderEmail || "");
      setWhatsappSendingEnabled(current.whatsappSendingEnabled !== undefined ? current.whatsappSendingEnabled : defaults.whatsappSendingEnabled);
      // Load from database first (if it has a value), then fallback to defaults/env vars
      // Use database value if it exists and is non-empty, otherwise use default/env var
      // Explicitly prioritize database values for API Key and Company ID
      const initialApiKeyFromDb = dbSettings?.whatsappApiKey;
      const initialCompanyIdFromDb = dbSettings?.whatsappCompanyId;
      
      setWhatsappApiKey(
        initialApiKeyFromDb && initialApiKeyFromDb !== "" 
          ? initialApiKeyFromDb 
          : (current.whatsappApiKey && current.whatsappApiKey !== "" 
              ? current.whatsappApiKey 
              : (defaults.whatsappApiKey || ""))
      );
      setWhatsappApiUrl(
        current.whatsappApiUrl && current.whatsappApiUrl !== "" 
          ? current.whatsappApiUrl 
          : (defaults.whatsappApiUrl || "https://publicapi.myoperator.co/chat/messages")
      );
      setWhatsappPhoneNumberId(
        current.whatsappPhoneNumberId && current.whatsappPhoneNumberId !== "" 
          ? current.whatsappPhoneNumberId 
          : (defaults.whatsappPhoneNumberId || "690875100784871")
      );
      setWhatsappCompanyId(
        initialCompanyIdFromDb && initialCompanyIdFromDb !== "" 
          ? initialCompanyIdFromDb 
          : (current.whatsappCompanyId && current.whatsappCompanyId !== "" 
              ? current.whatsappCompanyId 
              : (defaults.whatsappCompanyId || ""))
      );
      setWhatsappTemplateName(
        current.whatsappTemplateName && current.whatsappTemplateName !== "" 
          ? current.whatsappTemplateName 
          : (defaults.whatsappTemplateName || "resume_screener_message01")
      );
      setWhatsappLanguage(
        current.whatsappLanguage && current.whatsappLanguage !== "" 
          ? current.whatsappLanguage 
          : (defaults.whatsappLanguage || "en")
      );
      
      // Mark settings as loaded first
      setSettingsLoaded(true);
      isInitialLoad.current = false;
      
      // Enable auto-save after a delay to prevent triggering on initial load
      setTimeout(() => {
        setAutoSaveEnabled(true);
        console.log('[Settings] Auto-save enabled, settings loaded:', {
          hasApiKey: !!(current.whatsappApiKey),
          hasCompanyId: !!(current.whatsappCompanyId),
          apiKeyValue: current.whatsappApiKey ? '***' + current.whatsappApiKey.slice(-4) : 'empty',
          companyIdValue: current.whatsappCompanyId ? '***' + current.whatsappCompanyId.slice(-4) : 'empty',
        });
      }, 1500); // 1.5 second delay to ensure all state is set and prevent auto-save trigger
    };
    
    loadSettings();
  }, []);

  // Auto-save to database when settings change (only after initial load)
  useEffect(() => {
    // Don't auto-save during initial load or if auto-save is disabled
    if (isInitialLoad.current || !autoSaveEnabled || !settingsLoaded || saving) {
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      // Double-check we're not already saving and settings are loaded
      if (!isInitialLoad.current && !saving && settingsLoaded && autoSaveEnabled) {
        await saveAllSettings();
      }
    }, 2000); // Debounce: save 2 seconds after last change

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    emailSignature, emailSendingEnabled, gmailEmail, gmailAppPassword,
    googleClientId, googleClientSecret, googleRefreshToken, googleSenderEmail,
    whatsappSendingEnabled, whatsappApiKey, whatsappApiUrl, whatsappPhoneNumberId,
    whatsappCompanyId, whatsappTemplateName, whatsappLanguage
    // Note: Don't include autoSaveEnabled, settingsLoaded, saving, or isInitialLoad in deps
  ]);

  const saveAllSettings = async () => {
    if (saving) {
      console.log('[Settings] Save already in progress, skipping...');
      return;
    }
    
    setSaving(true);
    const settingsToSave = {
      emailSignature,
      emailSendingEnabled,
      gmailEmail,
      gmailAppPassword,
      googleClientId,
      googleClientSecret,
      googleRefreshToken,
      googleSenderEmail,
      whatsappSendingEnabled,
      whatsappApiKey,
      whatsappApiUrl,
      whatsappPhoneNumberId,
      whatsappCompanyId,
      whatsappTemplateName,
      whatsappLanguage,
    };

    console.log('[Settings] Saving to database:', {
      hasApiKey: !!settingsToSave.whatsappApiKey,
      hasCompanyId: !!settingsToSave.whatsappCompanyId,
      hasPhoneNumberId: !!settingsToSave.whatsappPhoneNumberId,
      hasTemplateName: !!settingsToSave.whatsappTemplateName,
      hasGmailEmail: !!settingsToSave.gmailEmail,
      hasGmailPassword: !!settingsToSave.gmailAppPassword,
      hasGoogleClientId: !!settingsToSave.googleClientId,
      hasGoogleClientSecret: !!settingsToSave.googleClientSecret,
      hasGoogleRefreshToken: !!settingsToSave.googleRefreshToken,
      allCredentialsCount: Object.values(settingsToSave).filter(v => v && v !== "").length,
    });

    try {
      await saveSettings(settingsToSave);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setSaving(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaving(false);
    }
  };

  const handleManualSave = async () => {
    setAutoSaveEnabled(false);
    await saveAllSettings();
    setTimeout(() => setAutoSaveEnabled(true), 3000);
  };

  const handleFetchFromDatabase = async () => {
    setLoading(true);
    setAutoSaveEnabled(false); // Disable auto-save while fetching
    
    try {
      // Directly call the API to get settings with debug info
      const response = await fetch('/api/settings/get');
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      const mergedSettings = data.data || {};
      const rawDb = data._rawDb || {};
      const allDbSettings = rawDb.allSettings || {};
      
      // Use raw database values if available, otherwise use merged settings
      const defaults = getSettings();
      
      // Check if we have database settings
      const hasDbSettings = allDbSettings && Object.keys(allDbSettings).length > 0;
      setLoadedFromDb(hasDbSettings);
      
      // For API Key and Company ID, prioritize raw database values
      // Use _rawDb values first, then check allDbSettings, then merged
      const apiKeyFromDb = rawDb.whatsappApiKey !== undefined ? rawDb.whatsappApiKey : (allDbSettings?.whatsappApiKey !== undefined ? allDbSettings.whatsappApiKey : null);
      const companyIdFromDb = rawDb.whatsappCompanyId !== undefined ? rawDb.whatsappCompanyId : (allDbSettings?.whatsappCompanyId !== undefined ? allDbSettings.whatsappCompanyId : null);
      
      // Update all state with database values
      setEmailSignature(mergedSettings.emailSignature || defaults.emailSignature || "");
      setEmailSendingEnabled(mergedSettings.emailSendingEnabled !== undefined ? mergedSettings.emailSendingEnabled : defaults.emailSendingEnabled);
      setGmailEmail(mergedSettings.gmailEmail || "");
      setGmailAppPassword(mergedSettings.gmailAppPassword || "");
      setGoogleClientId(mergedSettings.googleClientId || "");
      setGoogleClientSecret(mergedSettings.googleClientSecret || "");
      setGoogleRefreshToken(mergedSettings.googleRefreshToken || "");
      setGoogleSenderEmail(mergedSettings.googleSenderEmail || "");
      setWhatsappSendingEnabled(mergedSettings.whatsappSendingEnabled !== undefined ? mergedSettings.whatsappSendingEnabled : defaults.whatsappSendingEnabled);
      
      // Use raw database values for API Key and Company ID if they exist in DB
      // Even if they're empty strings, use them (user explicitly cleared them)
      setWhatsappApiKey(
        apiKeyFromDb !== null && apiKeyFromDb !== undefined
          ? apiKeyFromDb 
          : (mergedSettings.whatsappApiKey || defaults.whatsappApiKey || "")
      );
      setWhatsappApiUrl(mergedSettings.whatsappApiUrl || defaults.whatsappApiUrl || "https://publicapi.myoperator.co/chat/messages");
      setWhatsappPhoneNumberId(mergedSettings.whatsappPhoneNumberId || defaults.whatsappPhoneNumberId || "690875100784871");
      setWhatsappCompanyId(
        companyIdFromDb !== null && companyIdFromDb !== undefined
          ? companyIdFromDb 
          : (mergedSettings.whatsappCompanyId || defaults.whatsappCompanyId || "")
      );
      setWhatsappTemplateName(mergedSettings.whatsappTemplateName || defaults.whatsappTemplateName || "resume_screener_message01");
      setWhatsappLanguage(mergedSettings.whatsappLanguage || defaults.whatsappLanguage || "en");
      
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setLoading(false);
        setAutoSaveEnabled(true);
      }, 2000);
      
      // Log detailed information about what was fetched
      const apiKeyFound = apiKeyFromDb !== null && apiKeyFromDb !== undefined;
      const companyIdFound = companyIdFromDb !== null && companyIdFromDb !== undefined;
      
      console.log('[Settings] Fetched from database:', {
        hasDbSettings: hasDbSettings,
        apiKeyFromDb: apiKeyFound,
        apiKeyValue: apiKeyFound ? (apiKeyFromDb ? '***' + String(apiKeyFromDb).slice(-4) : 'empty string') : 'not in DB',
        apiKeyLength: apiKeyFromDb ? String(apiKeyFromDb).length : 0,
        companyIdFromDb: companyIdFound,
        companyIdValue: companyIdFound ? (companyIdFromDb ? '***' + String(companyIdFromDb).slice(-4) : 'empty string') : 'not in DB',
        companyIdLength: companyIdFromDb ? String(companyIdFromDb).length : 0,
        rawDbApiKey: rawDb.whatsappApiKey,
        rawDbCompanyId: rawDb.whatsappCompanyId,
        allDbSettingsKeys: Object.keys(allDbSettings),
        rawDbObject: rawDb,
      });
      
      // Show warning if database is empty
      if (!hasDbSettings || Object.keys(allDbSettings).length === 0) {
        console.warn('[Settings] Database is empty! Please save your credentials first by entering them and clicking "Save Now".');
      } else if (!apiKeyFound && !companyIdFound) {
        console.warn('[Settings] API Key and Company ID not found in database. Please save them first.');
      }
    } catch (err) {
      console.error('Failed to fetch settings from database:', err);
      setLoading(false);
      setAutoSaveEnabled(true);
    }
  };

  return (
    <>
      <Head>
        <title>Settings - IKF AI Resume Screener</title>
      </Head>
      <main className={`min-h-screen bg-slate-50 ${inter.className}`}>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <FaArrowLeft className="text-sm" />
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
                  <p className="text-sm text-slate-500 mt-1">Configure email and WhatsApp messaging</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleFetchFromDatabase}
                  disabled={loading || saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200"
                  title="Fetch all credentials from database"
                >
                  <FaSync className={`text-xs ${loading ? 'animate-spin' : ''}`} />
                  {loading ? "Loading..." : "Fetch from DB"}
                </button>
                <button
                  onClick={handleManualSave}
                  disabled={saving || loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <FaSave className="text-xs" />
                  {saving ? "Saving..." : "Save Now"}
                </button>
              </div>
            </div>
            
            {saved && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50/80 border border-emerald-200/60 text-emerald-700 text-sm">
                <FaCheckCircle className="text-emerald-600" />
                <span>{loading ? "Credentials fetched from database successfully!" : "Settings saved successfully to database!"}</span>
              </div>
            )}
            
            {loadedFromDb && !saved && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-50/80 border border-blue-200/60 text-blue-700 text-sm">
                <FaCheckCircle className="text-blue-600" />
                <span>Credentials loaded from database automatically</span>
              </div>
            )}
            
            {autoSaveEnabled && !saved && !loadedFromDb && (
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <FaInfoCircle className="text-slate-400" />
                <span>Auto-save enabled - changes are saved automatically to database</span>
              </div>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Email Signature */}
              <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FaSignature className="text-purple-600 text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-slate-900">Email Signature</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Added automatically to all email drafts</p>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={emailSignature}
                  onChange={(e) => setEmailSignature(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400"
                  placeholder="Best regards,\nJahanvi Patel\nI Knowledge Factory Pvt. Ltd.\n📞 +91 9665079317"
                />
              </section>

              {/* Email Sending */}
              <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FaEnvelope className="text-blue-600 text-base" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold text-slate-900">Email Sending</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Gmail API configuration</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={emailSendingEnabled}
                      onChange={(e) => setEmailSendingEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {emailSendingEnabled && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          Gmail Email <span className="text-xs text-slate-400 font-normal">(Saved to DB)</span>
                        </label>
                        <input
                          type="email"
                          value={gmailEmail}
                          onChange={(e) => setGmailEmail(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          App Password <span className="text-xs text-slate-400 font-normal">(Saved to DB)</span>
                        </label>
                        <input
                          type="password"
                          value={gmailAppPassword}
                          onChange={(e) => setGmailAppPassword(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                        />
                      </div>
                            </div>
                            
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900 py-2">
                        Advanced: OAuth 2.0 Configuration
                      </summary>
                      <div className="mt-3 space-y-4 p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2">
                              Client ID <span className="text-xs text-slate-400 font-normal">(Saved to DB)</span>
                            </label>
                            <input
                              type="text"
                              value={googleClientId}
                              onChange={(e) => setGoogleClientId(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2">
                              Client Secret <span className="text-xs text-slate-400 font-normal">(Saved to DB)</span>
                            </label>
                            <input
                              type="password"
                              value={googleClientSecret}
                              onChange={(e) => setGoogleClientSecret(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2">
                              Refresh Token <span className="text-xs text-slate-400 font-normal">(Saved to DB)</span>
                            </label>
                            <input
                              type="password"
                              value={googleRefreshToken}
                              onChange={(e) => setGoogleRefreshToken(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2">
                              Sender Email <span className="text-xs text-slate-400 font-normal">(Saved to DB)</span>
                            </label>
                            <input
                              type="email"
                              value={googleSenderEmail}
                              onChange={(e) => setGoogleSenderEmail(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    </details>
                    </div>
                  )}
              </section>

              {/* WhatsApp Messaging */}
              <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <FaWhatsapp className="text-green-600 text-base" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold text-slate-900">WhatsApp Messaging</h2>
                      <p className="text-xs text-slate-500 mt-0.5">MyOperator API configuration</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={whatsappSendingEnabled}
                      onChange={(e) => setWhatsappSendingEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {whatsappSendingEnabled && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="p-3 bg-blue-50/80 border border-blue-200/60 rounded-lg">
                      <p className="text-xs text-blue-800 leading-relaxed">
                        <FaInfoCircle className="inline mr-1.5 text-blue-500" />
                        All credentials are automatically saved to the database when you enter them. They will be automatically loaded when you access this page on Vercel - no need to enter them again!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          <FaLock className="inline mr-1.5 text-amber-500 text-xs" />
                          API Key * <span className="text-xs text-slate-400 font-normal">(Saved to DB - Auto-loads on Vercel)</span>
                        </label>
                        <input
                          type="password"
                          value={whatsappApiKey}
                          onChange={(e) => setWhatsappApiKey(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all placeholder:text-slate-400"
                          placeholder="Enter API Key"
                        />
                        {whatsappApiKey && (
                          <p className="mt-1.5 text-xs text-green-600">
                            ✓ {whatsappApiKey.length} chars {loadedFromDb && whatsappApiKey && <span className="text-blue-600">(Loaded from DB)</span>}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          <FaPhone className="inline mr-1.5 text-blue-500 text-xs" />
                          Phone Number ID *
                        </label>
                        <input
                          type="text"
                          value={whatsappPhoneNumberId}
                          onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all placeholder:text-slate-400"
                          placeholder="690875100784871"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          <FaGlobe className="inline mr-1.5 text-indigo-500 text-xs" />
                          Company ID * <span className="text-xs text-slate-400 font-normal">(Saved to DB - Auto-loads on Vercel)</span>
                        </label>
                        <input
                          type="text"
                          value={whatsappCompanyId}
                          onChange={(e) => setWhatsappCompanyId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all placeholder:text-slate-400"
                          placeholder="Enter Company ID"
                        />
                        {whatsappCompanyId && (
                          <p className="mt-1.5 text-xs text-green-600">
                            ✓ Configured {loadedFromDb && whatsappCompanyId && <span className="text-blue-600">(Loaded from DB)</span>}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          <FaGlobe className="inline mr-1.5 text-teal-500 text-xs" />
                          Template Name *
                        </label>
                        <input
                          type="text"
                          value={whatsappTemplateName}
                          onChange={(e) => setWhatsappTemplateName(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all placeholder:text-slate-400"
                          placeholder="resume_screener_message01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          <FaGlobe className="inline mr-1.5 text-cyan-500 text-xs" />
                          Language Code
                        </label>
                        <input
                          type="text"
                          value={whatsappLanguage}
                          onChange={(e) => setWhatsappLanguage(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all placeholder:text-slate-400"
                          placeholder="en"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          <FaGlobe className="inline mr-1.5 text-violet-500 text-xs" />
                          API Endpoint URL
                        </label>
                        <input
                          type="text"
                          value={whatsappApiUrl}
                          onChange={(e) => setWhatsappApiUrl(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all placeholder:text-slate-400"
                          placeholder="https://publicapi.myoperator.co/chat/messages"
                        />
                      </div>
                    </div>
                    </div>
                  )}
          </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Info</h3>
                  <div className="space-y-5 text-xs text-slate-600">
                    <div>
                      <p className="font-medium text-slate-900 mb-1.5 text-xs">Database Storage</p>
                      <p className="text-xs leading-relaxed text-slate-500">Settings saved to database persist across deployments.</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 mb-1.5 text-xs">Auto-Save</p>
                      <p className="text-xs leading-relaxed text-slate-500">Changes saved automatically after you stop typing.</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 mb-1.5 text-xs">Credentials</p>
                      <p className="text-xs leading-relaxed text-slate-500">All credentials saved locally are automatically stored in the database and will be fetched automatically when you access the Vercel link. No need to enter them again!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
