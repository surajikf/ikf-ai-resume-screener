import { useState } from "react";
import { FaTimes, FaRegEnvelope, FaUserTie, FaCopy } from "react-icons/fa";

const EvaluationModal = ({ candidate, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!candidate) return null;
  const {
    candidateName,
    roleApplied,
    experience,
    strengths = [],
    gaps = [],
    verdict,
    emailDraft,
    betterSuitedFocus,
    jobTitle,
    createdAt,
  } = candidate;

  const verdictColor =
    verdict === "Recommended"
      ? "bg-green-100 text-green-700"
      : verdict === "Partially Suitable"
        ? "bg-orange-100 text-orange-700"
        : "bg-red-100 text-red-700";

  const handleCopyEmail = async () => {
    if (!emailDraft?.body) return;
    try {
      await navigator.clipboard.writeText(
        `Subject: ${emailDraft.subject || ""}\n\n${emailDraft.body || ""}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy email", error);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4 py-8">
      <div className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <FaUserTie className="text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {candidateName || "Candidate"}
              </h3>
              <p className="text-sm text-slate-500">
                {roleApplied || jobTitle || "Role not specified"} •{" "}
                {new Date(createdAt || Date.now()).toLocaleString()}
              </p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verdictColor}`}>
            {verdict}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close evaluation"
          >
            <FaTimes />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Verdict
              </span>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${verdictColor}`}>
                {verdict}
              </span>
            </div>
            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
              <div>
                <p className="font-semibold text-slate-500">Role Applied</p>
                <p>{roleApplied || jobTitle || "Not specified"}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-500">
                  Experience / CTC / Notice / Location
                </p>
                <p>{experience || "Not captured"}</p>
              </div>
              {betterSuitedFocus && (
                <div className="md:col-span-2">
                  <p className="font-semibold text-slate-500">
                    Better Suited Area
                  </p>
                  <p>{betterSuitedFocus}</p>
                </div>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Key Strengths
                </p>
                <ul className="mt-2 space-y-2">
                  {strengths.length > 0 ? (
                    strengths.map((item, index) => (
                      <li
                        key={`strength-${index}`}
                        className="rounded-md bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                      >
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">No strengths noted.</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Gaps / Areas of Concern
                </p>
                <ul className="mt-2 space-y-2">
                  {gaps.length > 0 ? (
                    gaps.map((item, index) => (
                      <li
                        key={`gap-${index}`}
                        className="rounded-md bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                      >
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">No gaps noted.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {emailDraft && (
            <section className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center gap-3 text-blue-700">
                <FaRegEnvelope />
                <h4 className="text-base font-semibold">Email Draft</h4>
              </div>
              <div className="rounded-md bg-white p-4 text-sm text-slate-700 shadow">
                <p className="font-semibold text-slate-900">
                  Subject: {emailDraft.subject || "No subject"}
                </p>
                <hr className="my-3 border-slate-200" />
                <pre className="whitespace-pre-wrap font-sans">
                  {emailDraft.body || "No email content provided."}
                </pre>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                <FaCopy />
                {copied ? "Copied!" : "Copy email to clipboard"}
              </button>
            </section>
          )}
        </div>
        <footer className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EvaluationModal;

