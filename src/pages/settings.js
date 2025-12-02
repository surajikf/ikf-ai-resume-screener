import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Inter } from "next/font/google";
import { getSettings, saveSettings } from "@/utils/settingsStorage";

const inter = Inter({ subsets: ["latin"] });

export default function SettingsPage() {
  const [emailSignature, setEmailSignature] = useState("");
  const [emailSendingEnabled, setEmailSendingEnabled] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");
  const [googleSenderEmail, setGoogleSenderEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = getSettings();
    setEmailSignature(current.emailSignature || "");
    setEmailSendingEnabled(!!current.emailSendingEnabled);
    setGoogleClientId(current.googleClientId || "");
    setGoogleClientSecret(current.googleClientSecret || "");
    setGoogleRefreshToken(current.googleRefreshToken || "");
    setGoogleSenderEmail(current.googleSenderEmail || "");
  }, []);

  const handleSave = () => {
    saveSettings({
      emailSignature,
      emailSendingEnabled,
      googleClientId,
      googleClientSecret,
      googleRefreshToken,
      googleSenderEmail,
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
        className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 ${inter.className}`}
      >
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Settings
              </h1>
              <p className="text-sm text-slate-500">
                Control how email drafts are finalised before sending.
              </p>
            </div>
            <Link
              href="/"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to Screener
            </Link>
          </header>

          <section className="rounded-2xl bg-white shadow-lg border border-slate-200 p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Email Signature
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                This signature is appended to HR email drafts. You can include multiple lines,
                such as name, role, company, and contact details.
              </p>
            </div>

            <textarea
              rows={6}
              value={emailSignature}
              onChange={(e) => setEmailSignature(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder={"Best regards,\nYour Name\nYour Company\nPhone"}
            />

            <div className="flex items-center justify-between">
              {saved && (
                <p className="text-xs text-emerald-600">
                  Saved. New emails will use this signature and settings.
                </p>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="ml-auto inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Save changes
              </button>
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-white shadow-lg border border-slate-200 p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Email Sending (Gmail API)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Configure Gmail API credentials to enable sending emails directly from the app.
                These credentials are stored locally in your browser.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={emailSendingEnabled}
                onChange={(e) => setEmailSendingEnabled(e.target.checked)}
              />
              Enable email sending actions in the UI
            </label>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Google Client ID
                </label>
                <input
                  type="text"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  placeholder="your_client_id.apps.googleusercontent.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Google Client Secret
                </label>
                <input
                  type="password"
                  value={googleClientSecret}
                  onChange={(e) => setGoogleClientSecret(e.target.value)}
                  placeholder="GOCSPX-xxxxxxxxxxxxx"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Google Refresh Token
                </label>
                <input
                  type="password"
                  value={googleRefreshToken}
                  onChange={(e) => setGoogleRefreshToken(e.target.value)}
                  placeholder="1//xxxxxxxxxxxxx"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Sender Email Address
                </label>
                <input
                  type="email"
                  value={googleSenderEmail}
                  onChange={(e) => setGoogleSenderEmail(e.target.value)}
                  placeholder="your-email@domain.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-500">
                  This email address will be used as the "From" address when sending emails.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-900 mb-1">
                Security Note
              </p>
              <p className="text-xs text-amber-800">
                These credentials are stored in your browser's local storage. For production use,
                consider storing sensitive credentials server-side or using environment variables.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}


