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
      
      console.log('[Settings] Loaded from database:', {
        hasDbSettings: !!dbSettings,
        hasApiKey: !!current.whatsappApiKey,
        hasCompanyId: !!current.whatsappCompanyId,
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
      setWhatsappApiKey(current.whatsappApiKey || ""); // Load from database
      setWhatsappApiUrl(current.whatsappApiUrl || defaults.whatsappApiUrl);
      setWhatsappPhoneNumberId(current.whatsappPhoneNumberId || defaults.whatsappPhoneNumberId);
      setWhatsappCompanyId(current.whatsappCompanyId || ""); // Load from database
      setWhatsappTemplateName(current.whatsappTemplateName || defaults.whatsappTemplateName);
      setWhatsappLanguage(current.whatsappLanguage || defaults.whatsappLanguage);
      
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
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
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
                <span>Settings saved successfully!</span>
              </div>
            )}
            
            {autoSaveEnabled && !saved && (
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <FaInfoCircle className="text-slate-400" />
                <span>Auto-save enabled - changes are saved automatically</span>
              </div>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Email Signature */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FaSignature className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Email Signature</h2>
                    <p className="text-xs text-slate-500">Added automatically to all email drafts</p>
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={emailSignature}
                  onChange={(e) => setEmailSignature(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="Best regards,\nJahanvi Patel\nI Knowledge Factory Pvt. Ltd.\n📞 +91 9665079317"
                />
              </section>

              {/* Email Sending */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <FaEnvelope className="text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Email Sending</h2>
                      <p className="text-xs text-slate-500">Gmail API configuration</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={emailSendingEnabled}
                      onChange={(e) => setEmailSendingEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {emailSendingEnabled && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Gmail Email
                        </label>
                        <input
                          type="email"
                          value={gmailEmail}
                          onChange={(e) => setGmailEmail(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          App Password
                        </label>
                        <input
                          type="password"
                          value={gmailAppPassword}
                          onChange={(e) => setGmailAppPassword(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition"
                        />
                      </div>
                    </div>

                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                        Advanced: OAuth 2.0 Configuration
                      </summary>
                      <div className="mt-4 space-y-4 p-4 bg-slate-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Client ID
                            </label>
                            <input
                              type="text"
                              value={googleClientId}
                              onChange={(e) => setGoogleClientId(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Client Secret
                            </label>
                            <input
                              type="password"
                              value={googleClientSecret}
                              onChange={(e) => setGoogleClientSecret(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Refresh Token
                            </label>
                            <input
                              type="password"
                              value={googleRefreshToken}
                              onChange={(e) => setGoogleRefreshToken(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Sender Email
                            </label>
                            <input
                              type="email"
                              value={googleSenderEmail}
                              onChange={(e) => setGoogleSenderEmail(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                            />
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </section>

              {/* WhatsApp Messaging */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <FaWhatsapp className="text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">WhatsApp Messaging</h2>
                      <p className="text-xs text-slate-500">MyOperator API configuration</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={whatsappSendingEnabled}
                      onChange={(e) => setWhatsappSendingEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {whatsappSendingEnabled && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <FaInfoCircle className="inline mr-1" />
                        Settings are automatically saved to the database and will persist across deployments.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <FaLock className="inline mr-1 text-slate-400" />
                          API Key * <span className="text-xs text-slate-500 font-normal">(Pre-configured, editable)</span>
                        </label>
                        <input
                          type="password"
                          value={whatsappApiKey}
                          onChange={(e) => setWhatsappApiKey(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition"
                          placeholder="Hardcoded API Key (edit to override)"
                        />
                        {whatsappApiKey && (
                          <p className="mt-1 text-xs text-green-600">
                            ✓ Configured {whatsappApiKey.length > 0 ? `(${whatsappApiKey.length} characters)` : ''}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <FaPhone className="inline mr-1 text-slate-400" />
                          Phone Number ID * <span className="text-xs text-slate-500 font-normal">(Pre-configured)</span>
                        </label>
                        <input
                          type="text"
                          value={whatsappPhoneNumberId}
                          onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition"
                          placeholder="690875100784871"
                        />
                        <p className="mt-1 text-xs text-slate-500">From MyOperator dashboard (hardcoded default)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <FaGlobe className="inline mr-1 text-slate-400" />
                          Company ID * <span className="text-xs text-slate-500 font-normal">(Pre-configured, editable)</span>
                        </label>
                        <input
                          type="text"
                          value={whatsappCompanyId}
                          onChange={(e) => setWhatsappCompanyId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition"
                          placeholder="Hardcoded Company ID (edit to override)"
                        />
                        {whatsappCompanyId && (
                          <p className="mt-1 text-xs text-green-600">
                            ✓ Configured
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <FaGlobe className="inline mr-1 text-slate-400" />
                          Template Name *
                        </label>
                        <input
                          type="text"
                          value={whatsappTemplateName}
                          onChange={(e) => setWhatsappTemplateName(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition"
                          placeholder="resume_screener_message01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Language Code
                        </label>
                        <input
                          type="text"
                          value={whatsappLanguage}
                          onChange={(e) => setWhatsappLanguage(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition"
                          placeholder="en"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          API Endpoint URL
                        </label>
                        <input
                          type="text"
                          value={whatsappApiUrl}
                          onChange={(e) => setWhatsappApiUrl(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition"
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
              <div className="sticky top-8 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Info</h3>
                  <div className="space-y-3 text-xs text-slate-600">
                    <div>
                      <p className="font-medium text-slate-900 mb-1">Database Storage</p>
                      <p>All settings are automatically saved to the database and persist across deployments.</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 mb-1">Auto-Save</p>
                      <p>Changes are saved automatically 1 second after you stop typing.</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 mb-1">Security</p>
                      <p>Credentials are encrypted and stored securely in the database.</p>
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
