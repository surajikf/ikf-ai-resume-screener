import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { Inter } from "next/font/google";
import { getSettings, saveSettings, getSettingsFromDatabase } from "@/utils/settingsStorage";
import { FaEnvelope, FaSignature, FaCheckCircle, FaInfoCircle, FaLock, FaArrowLeft, FaWhatsapp, FaPhone, FaGlobe, FaSave } from "react-icons/fa";

const inter = Inter({ subsets: ["latin"] });

export default function SettingsPage() {
  const [emailSignature, setEmailSignature] = useState("");
  const [emailSendingEnabled, setEmailSendingEnabled] = useState(false);
  const [gmailEmail, setGmailEmail] = useState("");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");
  const [googleSenderEmail, setGoogleSenderEmail] = useState("");
  const [whatsappSendingEnabled, setWhatsappSendingEnabled] = useState(true);
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [whatsappApiUrl, setWhatsappApiUrl] = useState("https://publicapi.myoperator.co/chat/messages");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("690875100784871");
  const [whatsappCompanyId, setWhatsappCompanyId] = useState("");
  const [whatsappTemplateName, setWhatsappTemplateName] = useState("resume_screener_message01");
  const [whatsappLanguage, setWhatsappLanguage] = useState("en");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false); // Start disabled until settings are loaded
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [loadedFromDb, setLoadedFromDb] = useState(false); // Track if settings were loaded from database
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Load settings from database - API will auto-initialize defaults if needed
    const loadSettings = async () => {
      // Initialize defaults in database if they don't exist
      try {
        await fetch('/api/settings/init', { method: 'POST' });
      } catch (err) {
        console.log('Settings init check failed:', err);
      }
      
      // Load settings from database (will include defaults if just initialized)
      const dbSettings = await getSettingsFromDatabase();
      const defaults = getSettings();
      const current = dbSettings || defaults;
      
      // Check if we have database settings (not just defaults)
      const hasDbSettings = dbSettings && Object.keys(dbSettings).length > 0;
      setLoadedFromDb(hasDbSettings);
      
      console.log('[Settings] Loaded from database:', {
        hasDbSettings: !!dbSettings,
        loadedFromDb: hasDbSettings,
        hasApiKey: !!current.whatsappApiKey,
        hasCompanyId: !!current.whatsappCompanyId,
        hasGmailEmail: !!current.gmailEmail,
        hasGmailPassword: !!current.gmailAppPassword,
        apiKeyLength: current.whatsappApiKey?.length || 0,
        companyIdLength: current.whatsappCompanyId?.length || 0,
        apiKeyValue: current.whatsappApiKey ? '***' + current.whatsappApiKey.slice(-4) : 'empty',
        companyIdValue: current.whatsappCompanyId ? '***' + current.whatsappCompanyId.slice(-4) : 'empty',
        allKeys: Object.keys(current),
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
      setWhatsappApiKey(
        current.whatsappApiKey && current.whatsappApiKey !== "" 
          ? current.whatsappApiKey 
          : (defaults.whatsappApiKey || "")
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
        current.whatsappCompanyId && current.whatsappCompanyId !== "" 
          ? current.whatsappCompanyId 
          : (defaults.whatsappCompanyId || "")
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

  return (
    <>
      <Head>
        <title>Settings - IKF AI Resume Screener</title>
      </Head>
      <main className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 ${inter.className}`}>
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-6 py-4">
          {/* Header */}
          <header className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  <FaArrowLeft className="text-sm" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                  <p className="text-sm text-slate-600 mt-1">Configure email and WhatsApp messaging</p>
                </div>
              </div>
              <button
                onClick={handleManualSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave className="text-xs" />
                {saving ? "Saving..." : "Save Now"}
              </button>
            </div>
            
            {saved && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                <FaCheckCircle />
                <span>Settings saved successfully to database!</span>
              </div>
            )}
            
            {loadedFromDb && !saved && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                <FaCheckCircle />
                <span>Credentials loaded from database automatically</span>
              </div>
            )}
            
            {autoSaveEnabled && !saved && !loadedFromDb && (
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <FaInfoCircle className="text-slate-400" />
                <span>Auto-save enabled - changes are saved automatically to database</span>
              </div>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-3">
              {/* Email Signature */}
              <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FaSignature className="text-blue-600 text-sm" />
                    </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-slate-900">Email Signature</h2>
                    <p className="text-xs text-slate-500">Added automatically to all email drafts</p>
                  </div>
                </div>
            <textarea
                  rows={3}
              value={emailSignature}
              onChange={(e) => setEmailSignature(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-100 transition"
                  placeholder="Best regards,\nJahanvi Patel\nI Knowledge Factory Pvt. Ltd.\n📞 +91 9665079317"
                    />
          </section>

              {/* Email Sending */}
              <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FaEnvelope className="text-emerald-600 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold text-slate-900">Email Sending</h2>
                      <p className="text-xs text-slate-500">Gmail API configuration</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                        className="sr-only peer"
                checked={emailSendingEnabled}
                onChange={(e) => setEmailSendingEnabled(e.target.checked)}
              />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
                  </div>

                  {emailSendingEnabled && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Gmail Email <span className="text-xs text-slate-500 font-normal">(Saved to DB)</span>
                            </label>
                            <input
                              type="email"
                              value={gmailEmail}
                              onChange={(e) => setGmailEmail(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-100 transition"
                            />
                          </div>
                          <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          App Password <span className="text-xs text-slate-500 font-normal">(Saved to DB)</span>
                            </label>
                            <input
                              type="password"
                              value={gmailAppPassword}
                              onChange={(e) => setGmailAppPassword(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-100 transition"
                        />
                      </div>
                            </div>
                            
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900 py-1">
                        Advanced: OAuth 2.0 Configuration
                      </summary>
                      <div className="mt-2 space-y-2 p-2 bg-slate-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Client ID <span className="text-xs text-slate-500 font-normal">(Saved to DB)</span>
                              </label>
                              <input
                                type="text"
                                value={googleClientId}
                                onChange={(e) => setGoogleClientId(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 transition"
                              />
                            </div>
                            <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Client Secret <span className="text-xs text-slate-500 font-normal">(Saved to DB)</span>
                              </label>
                              <input
                                type="password"
                                value={googleClientSecret}
                                onChange={(e) => setGoogleClientSecret(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 transition"
                              />
                            </div>
                            <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Refresh Token <span className="text-xs text-slate-500 font-normal">(Saved to DB)</span>
                              </label>
                                <input
                                  type="password"
                                  value={googleRefreshToken}
                                  onChange={(e) => setGoogleRefreshToken(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 transition"
                            />
                            </div>
                            <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Sender Email <span className="text-xs text-slate-500 font-normal">(Saved to DB)</span>
                              </label>
                              <input
                                type="email"
                                value={googleSenderEmail}
                                onChange={(e) => setGoogleSenderEmail(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 transition"
                            />
                          </div>
                        </div>
                      </div>
                    </details>
                    </div>
                  )}
              </section>

              {/* WhatsApp Messaging */}
              <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <FaWhatsapp className="text-green-600 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold text-slate-900">WhatsApp Messaging</h2>
                      <p className="text-xs text-slate-500">MyOperator API configuration</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={whatsappSendingEnabled}
                        onChange={(e) => setWhatsappSendingEnabled(e.target.checked)}
                      />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {whatsappSendingEnabled && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="p-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-800">
                        <FaInfoCircle className="inline mr-1 text-xs" />
                        All credentials are automatically saved to the database when you enter them. They will be automatically loaded when you access this page on Vercel - no need to enter them again!
                            </p>
                      </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          <FaLock className="inline mr-1 text-slate-400 text-xs" />
                          API Key * <span className="text-xs text-slate-500 font-normal">(From DB/Env)</span>
                          </label>
                          <input
                            type="password"
                            value={whatsappApiKey}
                            onChange={(e) => setWhatsappApiKey(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-100 transition"
                          placeholder="Enter API Key"
                        />
                        {whatsappApiKey && (
                          <p className="mt-0.5 text-xs text-green-600">
                            ✓ {whatsappApiKey.length} chars
                          </p>
                        )}
                        </div>
                        <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          <FaPhone className="inline mr-1 text-slate-400 text-xs" />
                            Phone Number ID *
                          </label>
                          <input
                            type="text"
                            value={whatsappPhoneNumberId}
                            onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-100 transition"
                            placeholder="690875100784871"
                          />
                        </div>
                        <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          <FaGlobe className="inline mr-1 text-slate-400 text-xs" />
                          Company ID * <span className="text-xs text-slate-500 font-normal">(From DB/Env)</span>
                          </label>
                          <input
                            type="text"
                            value={whatsappCompanyId}
                            onChange={(e) => setWhatsappCompanyId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-100 transition"
                          placeholder="Enter Company ID"
                        />
                        {whatsappCompanyId && (
                          <p className="mt-0.5 text-xs text-green-600">
                            ✓ Configured
                          </p>
                        )}
                      </div>
                        <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          <FaGlobe className="inline mr-1 text-slate-400 text-xs" />
                            Template Name *
                          </label>
                          <input
                            type="text"
                            value={whatsappTemplateName}
                            onChange={(e) => setWhatsappTemplateName(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-100 transition"
                            placeholder="resume_screener_message01"
                          />
                        </div>
                        <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                            Language Code
                          </label>
                          <input
                            type="text"
                            value={whatsappLanguage}
                            onChange={(e) => setWhatsappLanguage(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-100 transition"
                            placeholder="en"
                          />
            </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          API Endpoint URL
                        </label>
                        <input
                          type="text"
                          value={whatsappApiUrl}
                          onChange={(e) => setWhatsappApiUrl(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-100 transition"
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
              <div className="sticky top-6">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                  <h3 className="text-xs font-semibold text-slate-900 mb-2">Quick Info</h3>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div>
                      <p className="font-medium text-slate-900 mb-0.5 text-xs">Database Storage</p>
                      <p className="text-xs">Settings saved to database persist across deployments.</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 mb-0.5 text-xs">Auto-Save</p>
                      <p className="text-xs">Changes saved automatically after you stop typing.</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 mb-0.5 text-xs">Credentials</p>
                      <p className="text-xs">All credentials saved locally are automatically stored in the database and will be fetched automatically when you access the Vercel link. No need to enter them again!</p>
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
