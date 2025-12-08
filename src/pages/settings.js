import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Inter } from "next/font/google";
import { getSettings, saveSettings } from "@/utils/settingsStorage";
import { FaEnvelope, FaSignature, FaCog, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaLock, FaGlobe, FaArrowLeft, FaWhatsapp, FaPhone } from "react-icons/fa";

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
  const [whatsappSendingEnabled, setWhatsappSendingEnabled] = useState(false);
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [whatsappApiUrl, setWhatsappApiUrl] = useState("");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("");
  const [whatsappCompanyId, setWhatsappCompanyId] = useState("");
  const [whatsappTemplateName, setWhatsappTemplateName] = useState("");
  const [whatsappLanguage, setWhatsappLanguage] = useState("en");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = getSettings();
    setEmailSignature(current.emailSignature || "");
    setEmailSendingEnabled(!!current.emailSendingEnabled);
    setGmailEmail(current.gmailEmail || "");
    setGmailAppPassword(current.gmailAppPassword || "");
    setGoogleClientId(current.googleClientId || "");
    setGoogleClientSecret(current.googleClientSecret || "");
    setGoogleRefreshToken(current.googleRefreshToken || "");
    setGoogleSenderEmail(current.googleSenderEmail || "");
    setWhatsappSendingEnabled(!!current.whatsappSendingEnabled);
    setWhatsappApiKey(current.whatsappApiKey || "");
    setWhatsappApiUrl(current.whatsappApiUrl || "https://publicapi.myoperator.co/chat/messages");
    setWhatsappPhoneNumberId(current.whatsappPhoneNumberId || "");
    setWhatsappCompanyId(current.whatsappCompanyId || "");
    setWhatsappTemplateName(current.whatsappTemplateName || "");
    setWhatsappLanguage(current.whatsappLanguage || "en");
  }, []);


  const handleSave = async () => {
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

    // Save to database
    try {
      const response = await fetch('/api/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave),
      });
      
      if (response.ok) {
        console.log('Settings saved to database');
      }
    } catch (err) {
      console.log('Database save failed, using localStorage:', err);
    }

    // Also save to localStorage as fallback
    saveSettings(settingsToSave);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Head>
        <title>Settings - IKF AI Resume Screener | I Knowledge Factory Pvt. Ltd.</title>
      </Head>
      <main
        className={`min-h-screen bg-slate-50 ${inter.className}`}
      >
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-4">
          {/* Header */}
          <header className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                  <span className="text-lg font-bold">IKF</span>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">
                    Settings
                  </h1>
                  <p className="text-xs font-medium text-slate-600">
                    I Knowledge Factory Pvt. Ltd.
                  </p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Configure email signatures, API credentials, and messaging preferences
                  </p>
                </div>
              </div>
            <Link
              href="/"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
                <FaArrowLeft className="text-xs" />
                Back to Screener
            </Link>
            </div>
            
            {/* Save Status Banner */}
            {saved && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2">
                <FaCheckCircle className="text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-800 font-medium">
                  Settings saved successfully! Changes will apply to new messages.
                </p>
              </div>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">

              {/* Email Signature Section */}
              <section className="rounded-lg bg-white border border-slate-200 overflow-hidden">
                <div className="bg-blue-600 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FaSignature className="text-white text-base" />
            <div>
                      <h2 className="text-base font-semibold text-white">
                Email Signature
              </h2>
                      <p className="text-xs text-blue-100">
                        Automatically added to all email drafts
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-start gap-2">
                      <FaInfoCircle className="text-blue-600 mt-0.5 flex-shrink-0 text-xs" />
                      <p className="text-xs text-blue-800">
                        This signature will be automatically appended to all email drafts. Include your name, role, company, and contact information.
                      </p>
                    </div>
            </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Signature Text
                    </label>
            <textarea
              rows={6}
              value={emailSignature}
              onChange={(e) => setEmailSignature(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 font-mono"
                      placeholder={"Best regards,\nJahanvi Patel\nI Knowledge Factory Pvt. Ltd.\n📞 +91 9665079317"}
                    />
                  </div>
            </div>
          </section>

              {/* Email Sending Section */}
              <section className="rounded-lg bg-white border border-slate-200 overflow-hidden">
                <div className="bg-emerald-600 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="text-white text-base" />
            <div>
                        <h2 className="text-base font-semibold text-white">
                          Email Sending
              </h2>
                        <p className="text-xs text-emerald-100">
                          Gmail API Configuration
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                      emailSendingEnabled 
                        ? "bg-emerald-700 text-white" 
                        : "bg-emerald-700/50 text-emerald-100"
                    }`}>
                      {emailSendingEnabled ? (
                        <>
                          <FaCheckCircle className="text-xs" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <FaCog className="text-xs" />
                          Disabled
                        </>
                      )}
                    </div>
                  </div>
            </div>

                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FaEnvelope className={emailSendingEnabled ? "text-emerald-600" : "text-slate-400"} />
                      <div>
                        <label className="text-sm font-semibold text-slate-900 cursor-pointer">
                          Enable Email Sending
                        </label>
                        <p className="text-xs text-slate-500">
                          Allow sending emails directly from the application
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                        className="sr-only peer"
                checked={emailSendingEnabled}
                onChange={(e) => setEmailSendingEnabled(e.target.checked)}
              />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
                  </div>

                  {emailSendingEnabled && (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      {/* Simple Gmail SMTP Setup */}
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 mb-4">
                        <div className="flex items-start gap-2 mb-3">
                          <FaCheckCircle className="text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-900 mb-1">✅ Simple Gmail Setup (Easiest - No OAuth Needed!)</p>
                            <p className="text-xs text-emerald-700">Use your Gmail account with an App Password - Works immediately!</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <FaEnvelope className="text-slate-400 text-xs" />
                              Gmail Email Address
                            </label>
                            <input
                              type="email"
                              value={gmailEmail}
                              onChange={(e) => setGmailEmail(e.target.value)}
                              placeholder="suraj.sonnar@ikf.co.in"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <FaLock className="text-slate-400 text-xs" />
                              Gmail App Password
                            </label>
                            <input
                              type="password"
                              value={gmailAppPassword}
                              onChange={(e) => setGmailAppPassword(e.target.value)}
                              placeholder="Enter 16-character app password"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                            />
                            <div className="mt-2 p-2 bg-white rounded border border-emerald-200">
                              <p className="text-xs font-semibold text-emerald-900 mb-1">📋 How to Generate App Password:</p>
                              <ol className="text-xs text-emerald-800 space-y-1 list-decimal list-inside ml-1">
                                <li>Go to: <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Account Security</a></li>
                                <li>Enable <strong>"2-Step Verification"</strong> (if not already enabled)</li>
                                <li>Click <strong>"App passwords"</strong> (under "2-Step Verification")</li>
                                <li>Select app: <strong>&quot;Mail&quot;</strong> and device: <strong>&quot;Other (Custom name)&quot;</strong></li>
                                <li>Enter name: <strong>&quot;Resume Screener&quot;</strong> → Click <strong>&quot;Generate&quot;</strong></li>
                                <li>Copy the <strong>16-character password</strong> (no spaces) and paste it above</li>
                              </ol>
                              <p className="text-xs text-emerald-700 mt-2 font-medium">⚠️ Important: Use the App Password, NOT your regular Gmail password!</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Advanced Gmail API Option */}
                      <details className="rounded-lg border border-slate-200 bg-slate-50">
                        <summary className="px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
                          Option 2: Gmail API (OAuth2) - Better for Production - Click to expand
                        </summary>
                        <div className="p-3 space-y-3 border-t border-slate-200">
                          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 mb-3">
                            <p className="text-xs font-semibold text-blue-900 mb-2">✅ You already have OAuth credentials! Here&apos;s how to use them:</p>
                            <p className="text-xs text-blue-800 mb-2">Your credentials are already configured. You just need to get a Refresh Token (one-time setup).</p>
                            <p className="text-xs font-semibold text-blue-900 mb-2">📋 Get Refresh Token (Choose ONE method):</p>
                            
                            <div className="mb-3 p-2 bg-white rounded border border-blue-200">
                              <p className="text-xs font-semibold text-blue-900 mb-1">Method A: OAuth Playground (Easiest)</p>
                              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside ml-1">
                                <li>Go to: <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener noreferrer" className="underline font-medium text-blue-600">OAuth Playground</a></li>
                                <li>Click ⚙️ gear icon → Check &quot;Use your own OAuth credentials&quot;</li>
                                <li>Enter:
                                  <div className="ml-3 mt-1 p-1.5 bg-slate-50 rounded font-mono text-xs">
                                    Client ID: 1016999992905-60298ij6g0qln710hhkc58ab9nke433b.apps.googleusercontent.com<br/>
                                    Secret: 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
                                  </div>
                                </li>
                                <li>Select: Gmail API v1 → <code className="bg-slate-100 px-1">https://www.googleapis.com/auth/gmail.send</code></li>
                                <li>Click &quot;Authorize APIs&quot; → Sign in → &quot;Exchange authorization code for tokens&quot;</li>
                                <li>Copy the &quot;Refresh token&quot; and paste below</li>
                              </ol>
                            </div>

                            <div className="p-2 bg-white rounded border border-blue-200">
                              <p className="text-xs font-semibold text-blue-900 mb-1">Method B: Fix Redirect URI (If Method A fails)</p>
                              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside ml-1">
                                <li>Go to: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-medium text-blue-600">Google Cloud Console</a></li>
                                <li>Click your OAuth client (Web client 1)</li>
                                <li>In &quot;Authorized redirect URIs&quot;, add:
                                  <div className="ml-3 mt-1 p-1.5 bg-slate-50 rounded font-mono text-xs space-y-1">
                                    <div>✅ https://developers.google.com/oauthplayground</div>
                                    <div>✅ http://localhost:3001/api/gmail-oauth/callback</div>
                                  </div>
                                </li>
                                <li>Click &quot;Save&quot; and wait 5-10 minutes for changes to propagate</li>
                                <li>Try Method A again</li>
                              </ol>
                            </div>
                            
                            <div className="mt-3 p-2 bg-emerald-50 rounded border border-emerald-200">
                              <p className="text-xs font-semibold text-emerald-900 mb-1">✅ Your Credentials (Ready to Use):</p>
                              <div className="text-xs text-emerald-800 font-mono bg-white p-2 rounded border border-emerald-200">
                                <div>Client ID: 1016999992905-60298ij6g0qln7l0hhkc58ab9nke433b.apps.googleusercontent.com</div>
                                <div>Client Secret: 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</div>
                                <div>Project: amplified-asset-469708-g9</div>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <FaLock className="text-slate-400 text-xs" />
                                Google Client ID
                              </label>
                              <input
                                type="text"
                                value={googleClientId}
                                onChange={(e) => setGoogleClientId(e.target.value)}
                                placeholder="1016999992905-60298ij6g0qln7l0hhkc58ab9nke433b.apps.googleusercontent.com"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <FaLock className="text-slate-400 text-xs" />
                                Google Client Secret
                              </label>
                              <input
                                type="password"
                                value={googleClientSecret}
                                onChange={(e) => setGoogleClientSecret(e.target.value)}
                                placeholder="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"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <FaLock className="text-slate-400 text-xs" />
                                Google Refresh Token
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="password"
                                  value={googleRefreshToken}
                                  onChange={(e) => setGoogleRefreshToken(e.target.value)}
                                  placeholder="1//xxxxxxxxxxxxx"
                                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                                />
                                {googleClientId && googleClientSecret && (
                                  <a
                                    href="https://developers.google.com/oauthplayground/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 whitespace-nowrap inline-block"
                                    title="Open OAuth Playground to get Refresh Token"
                                  >
                                    Get Token
                                  </a>
                                )}
                              </div>
                              <p className="mt-1.5 text-xs text-slate-500">
                                Click &quot;Get Token&quot; to open OAuth Playground. After getting the refresh token, paste it above.
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <FaEnvelope className="text-slate-400 text-xs" />
                                Sender Email Address
                              </label>
                              <input
                                type="email"
                                value={googleSenderEmail}
                                onChange={(e) => setGoogleSenderEmail(e.target.value)}
                                placeholder="your-email@domain.com"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100"
                              />
                            </div>
                          </div>
                        </div>
                      </details>

                      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                        <div className="flex items-start gap-2">
                          <FaExclamationTriangle className="text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-amber-900 mb-1">
                              Security Notice
                            </p>
                            <p className="text-xs text-amber-800">
                              Credentials are stored locally in your browser. For production, consider server-side storage or environment variables.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* WhatsApp Messaging Section */}
              <section className="rounded-lg bg-white border border-slate-200 overflow-hidden">
                <div className="bg-green-600 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaWhatsapp className="text-white text-base" />
                      <div>
                        <h2 className="text-base font-semibold text-white">
                          WhatsApp Messaging
                        </h2>
                        <p className="text-xs text-green-100">
                          API Configuration & Settings
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                      whatsappSendingEnabled 
                        ? "bg-green-700 text-white" 
                        : "bg-green-700/50 text-green-100"
                    }`}>
                      {whatsappSendingEnabled ? (
                        <>
                          <FaCheckCircle className="text-xs" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <FaCog className="text-xs" />
                          Disabled
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FaWhatsapp className={whatsappSendingEnabled ? "text-green-600" : "text-slate-400"} />
                      <div>
                        <label className="text-sm font-semibold text-slate-900 cursor-pointer">
                          Enable WhatsApp Messaging
                        </label>
                        <p className="text-xs text-slate-500">
                          Allow sending WhatsApp messages directly from the application
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={whatsappSendingEnabled}
                        onChange={(e) => setWhatsappSendingEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {whatsappSendingEnabled && (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <div className="flex items-start gap-2">
                          <FaInfoCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-blue-900 mb-1">
                              MyOperator WhatsApp API
                            </p>
                            <p className="text-xs text-blue-800">
                              Configure your MyOperator API credentials to send WhatsApp messages. Get your credentials from your MyOperator dashboard.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <FaLock className="text-slate-400 text-xs" />
                            MyOperator API Key *
                          </label>
                          <input
                            type="password"
                            value={whatsappApiKey}
                            onChange={(e) => setWhatsappApiKey(e.target.value)}
                            placeholder="Your MyOperator API Key"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-100"
                          />
                          <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                            <FaInfoCircle className="text-slate-400" />
                            Used in Authorization header
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <FaPhone className="text-slate-400 text-xs" />
                            Phone Number ID *
                          </label>
                          <input
                            type="text"
                            value={whatsappPhoneNumberId}
                            onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                            placeholder="690875100784871"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-100"
                          />
                          <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                            <FaInfoCircle className="text-slate-400" />
                            Your WhatsApp Business phone number ID
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <FaGlobe className="text-slate-400 text-xs" />
                            Company ID *
                          </label>
                          <input
                            type="text"
                            value={whatsappCompanyId}
                            onChange={(e) => setWhatsappCompanyId(e.target.value)}
                            placeholder="689044bc84f5e822"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-100"
                          />
                          <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                            <FaInfoCircle className="text-slate-400" />
                            Your MyOperator Company ID (X-MYOP-COMPANY-ID header)
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <FaGlobe className="text-slate-400 text-xs" />
                            Template Name *
                          </label>
                          <input
                            type="text"
                            value={whatsappTemplateName}
                            onChange={(e) => setWhatsappTemplateName(e.target.value)}
                            placeholder="resume_screener_message01"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-100"
                          />
                          <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                            <FaInfoCircle className="text-slate-400" />
                            Your approved MyOperator template name
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <FaGlobe className="text-slate-400 text-xs" />
                            Language Code
                          </label>
                          <input
                            type="text"
                            value={whatsappLanguage}
                            onChange={(e) => setWhatsappLanguage(e.target.value)}
                            placeholder="en"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-100"
                          />
                          <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                            <FaInfoCircle className="text-slate-400" />
                            ISO language code (e.g., en, hi)
                </p>
              </div>
            </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                          <FaGlobe className="text-slate-400 text-xs" />
                          API Endpoint URL
                        </label>
                        <input
                          type="text"
                          value={whatsappApiUrl}
                          onChange={(e) => setWhatsappApiUrl(e.target.value)}
                          placeholder="https://publicapi.myoperator.co/chat/messages"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-100"
                        />
                        <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                          <FaInfoCircle className="text-slate-400" />
                          MyOperator API endpoint (default provided)
                        </p>
                      </div>


                      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                        <div className="flex items-start gap-2">
                          <FaExclamationTriangle className="text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
              <p className="text-xs font-semibold text-amber-900 mb-1">
                              Security Notice
              </p>
              <p className="text-xs text-amber-800">
                              Credentials are stored locally in your browser. For production, consider server-side storage or environment variables.
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
            </div>
          </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-3">
                {/* Quick Actions Card */}
                <div className="rounded-lg bg-blue-600 p-4 text-white">
                  <h3 className="text-base font-semibold mb-1">Quick Actions</h3>
                  <p className="text-xs text-blue-100 mb-3">
                    Save all your settings at once
                  </p>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 active:scale-[0.98]"
                  >
                    Save All Settings
                  </button>
                </div>

                {/* Info Card */}
                <div className="rounded-lg bg-white border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaInfoCircle className="text-blue-600 text-sm" />
                    <h3 className="text-sm font-semibold text-slate-900">Need Help?</h3>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div>
                      <p className="font-medium text-slate-900 mb-0.5">Email Setup</p>
                      <p className="text-xs">Configure Gmail API credentials from Google Cloud Console</p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 mb-0.5">Security</p>
                      <p className="text-xs">All credentials are stored locally in your browser</p>
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


