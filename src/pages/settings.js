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


  const handleSave = () => {
    saveSettings({
      emailSignature,
      emailSendingEnabled,
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
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Head>
        <title>Settings • IKF AI Resume Screener</title>
      </Head>
      <main
        className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 ${inter.className}`}
      >
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Settings
                </h1>
                <p className="text-sm text-slate-600">
                  Configure email signatures, API credentials, and messaging preferences
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
              >
                <FaArrowLeft className="text-xs" />
                Back to Screener
              </Link>
            </div>
            
            {/* Save Status Banner */}
            {saved && (
              <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <FaCheckCircle className="text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-800 font-medium">
                  Settings saved successfully! Changes will apply to new messages.
                </p>
              </div>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Email Signature Section */}
              <section className="rounded-2xl bg-white shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <FaSignature className="text-white text-lg" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Email Signature
                      </h2>
                      <p className="text-xs text-blue-100">
                        Automatically added to all email drafts
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                    <div className="flex items-start gap-2">
                      <FaInfoCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
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
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
                      placeholder={"Best regards,\nJahanvi Patel\nI Knowledge Factory Pvt. Ltd.\n📞 +91 9665079317"}
                    />
                  </div>
                </div>
              </section>

              {/* Email Sending Section */}
              <section className="rounded-2xl bg-white shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FaEnvelope className="text-white text-lg" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          Email Sending
                        </h2>
                        <p className="text-xs text-emerald-100">
                          Gmail API Configuration
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                      emailSendingEnabled 
                        ? "bg-white/20 text-white" 
                        : "bg-white/10 text-emerald-100"
                    }`}>
                      {emailSendingEnabled ? (
                        <>
                          <FaCheckCircle />
                          Enabled
                        </>
                      ) : (
                        <>
                          <FaCog className="animate-spin" />
                          Disabled
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${emailSendingEnabled ? "bg-emerald-100" : "bg-slate-200"}`}>
                        <FaEnvelope className={emailSendingEnabled ? "text-emerald-600" : "text-slate-400"} />
                      </div>
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
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {emailSendingEnabled && (
                    <div className="space-y-4 pt-2 border-t border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <FaLock className="text-slate-400 text-xs" />
                            Google Client ID
                          </label>
                          <input
                            type="text"
                            value={googleClientId}
                            onChange={(e) => setGoogleClientId(e.target.value)}
                            placeholder="your_client_id.apps.googleusercontent.com"
                            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                            placeholder="GOCSPX-xxxxxxxxxxxxx"
                            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <FaLock className="text-slate-400 text-xs" />
                            Google Refresh Token
                          </label>
                          <input
                            type="password"
                            value={googleRefreshToken}
                            onChange={(e) => setGoogleRefreshToken(e.target.value)}
                            placeholder="1//xxxxxxxxxxxxx"
                            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          />
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
                            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          />
                          <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                            <FaInfoCircle className="text-slate-400" />
                            This email will be used as the &quot;From&quot; address
                          </p>
                        </div>
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

              {/* WhatsApp Messaging Section */}
              <section className="rounded-2xl bg-white shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FaWhatsapp className="text-white text-lg" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          WhatsApp Messaging
                        </h2>
                        <p className="text-xs text-green-100">
                          API Configuration & Settings
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                      whatsappSendingEnabled 
                        ? "bg-white/20 text-white" 
                        : "bg-white/10 text-green-100"
                    }`}>
                      {whatsappSendingEnabled ? (
                        <>
                          <FaCheckCircle />
                          Enabled
                        </>
                      ) : (
                        <>
                          <FaCog className="animate-spin" />
                          Disabled
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${whatsappSendingEnabled ? "bg-green-100" : "bg-slate-200"}`}>
                        <FaWhatsapp className={whatsappSendingEnabled ? "text-green-600" : "text-slate-400"} />
                      </div>
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
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {whatsappSendingEnabled && (
                    <div className="space-y-4 pt-2 border-t border-slate-200">
                      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
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
                            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
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
                            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                          />
                          <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                            <FaInfoCircle className="text-slate-400" />
                            Your MyOperator Company ID (X-MYOP-COMPANY-ID header)
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
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
                            className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
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
                          className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
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
              <div className="sticky top-8 space-y-4">
                {/* Quick Actions Card */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg p-6 text-white">
                  <h3 className="text-lg font-bold mb-2">Quick Actions</h3>
                  <p className="text-sm text-blue-100 mb-4">
                    Save all your settings at once
                  </p>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-blue-600 shadow-md transition hover:bg-blue-50 hover:shadow-lg"
                  >
                    Save All Settings
                  </button>
                </div>

                {/* Info Card */}
                <div className="rounded-2xl bg-white shadow-lg border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaInfoCircle className="text-blue-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Need Help?</h3>
                  </div>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">Email Setup</p>
                      <p className="text-xs">Configure Gmail API credentials from Google Cloud Console</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">Security</p>
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


