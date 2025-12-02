import { useEffect, useState } from "react";
import Head from "next/head";
import { Inter } from "next/font/google";
import { getSettings, saveSettings } from "@/utils/settingsStorage";

const inter = Inter({ subsets: ["latin"] });

export default function SettingsPage() {
  const [emailSignature, setEmailSignature] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = getSettings();
    setEmailSignature(current.emailSignature || "");
  }, []);

  const handleSave = () => {
    saveSettings({ emailSignature });
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
            <a
              href="/"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to Screener
            </a>
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
                  Saved. New emails will use this signature.
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
        </div>
      </main>
    </>
  );
}


