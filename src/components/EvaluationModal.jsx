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
      <div className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {candidateName || "Candidate"}
              </h3>
              <p className="text-sm text-slate-500">
                {roleApplied || jobTitle || "Role"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verdictColor}`}>
              {verdict}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          {experience && (
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500 mb-1">Details</p>
              <p className="text-sm text-slate-700">{experience}</p>
            </section>
          )}
          {betterSuitedFocus && (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium text-amber-700 mb-1">Better Suited For</p>
              <p className="text-sm text-amber-800">{betterSuitedFocus}</p>
            </section>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-3">Strengths</p>
              <ul className="space-y-2">
                {strengths.length > 0 ? (
                  strengths.map((item, index) => (
                    <li
                      key={`strength-${index}`}
                      className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-slate-700"
                    >
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-400">None noted</li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-3">Gaps</p>
              <ul className="space-y-2">
                {gaps.length > 0 ? (
                  gaps.map((item, index) => (
                    <li
                      key={`gap-${index}`}
                      className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-slate-700"
                    >
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-400">None noted</li>
                )}
              </ul>
            </div>
          </div>

          {emailDraft && (
            <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <FaRegEnvelope />
                  <h4 className="text-sm font-semibold">Email Draft</h4>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                >
                  <FaCopy />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="rounded-md bg-white p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900 mb-2">
                  {emailDraft.subject || "No subject"}
                </p>
                <pre className="whitespace-pre-wrap font-sans text-slate-600">
                  {emailDraft.body || "No email content provided."}
                </pre>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;

