import { useState, useEffect } from "react";
import Link from "next/link";
import { FaTimes, FaRegEnvelope, FaCopy, FaChartLine, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";
import { getSettings } from "@/utils/settingsStorage";

const buildEmailBodyWithSignature = (body, signature) => {
  const baseBody = body || "";
  if (!signature) return baseBody;

  const markers = ["Best regards", "Best Regards", "Regards,", "Thanks & Regards", "Thanks,"];
  let cutIndex = -1;

  markers.forEach((marker) => {
    const idx = baseBody.lastIndexOf(marker);
    if (idx !== -1) {
      if (cutIndex === -1 || idx < cutIndex) {
        cutIndex = idx;
      }
    }
  });

  const trimmedBody = cutIndex !== -1 ? baseBody.slice(0, cutIndex).trimEnd() : baseBody.trimEnd();
  return `${trimmedBody}\n\n${signature.trim()}`;
};

const EvaluationModal = ({ candidate, onClose, emailSignature, canSendEmail }) => {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  if (!candidate) return null;
  const {
    candidateName,
    candidateEmail = "",
    roleApplied,
    experience,
    candidateLocation,
    companyLocation,
    strengths = [],
    gaps = [],
    educationGaps = [],
    experienceGaps = [],
    verdict,
    matchScore = 0,
    scoreBreakdown = {},
    emailDraft,
    betterSuitedFocus,
    jobTitle,
    createdAt,
  } = candidate;

  // Initialize toEmail with candidate's email from resume, but keep it editable
  const [toEmail, setToEmail] = useState(candidateEmail || "");

  // Update email when candidate changes
  useEffect(() => {
    if (candidateEmail) {
      setToEmail(candidateEmail);
    }
  }, [candidateEmail]);

  const verdictColor =
    verdict === "Recommended"
      ? "bg-green-100 text-green-700"
      : verdict === "Partially Suitable"
        ? "bg-orange-100 text-orange-700"
        : "bg-red-100 text-red-700";

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 50) return "bg-orange-50 border-orange-200";
    return "bg-red-50 border-red-200";
  };

  const initialSubject = emailDraft?.subject || "";
  const initialBody = emailDraft
    ? buildEmailBodyWithSignature(emailDraft.body || "", emailSignature)
    : "";

  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  const handleCopyEmail = async () => {
    if (!subject && !body) return;
    try {
      await navigator.clipboard.writeText(
        `Subject: ${subject || ""}\n\n${body || ""}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy email", error);
    }
  };

  const handleSendEmail = async () => {
    if (!canSendEmail) {
      setSendStatus("Please enable email sending in Settings and configure Gmail API credentials.");
      setTimeout(() => setSendStatus(""), 5000);
      return;
    }

    if (!toEmail || !subject || !body) {
      setSendStatus("Please fill in all fields (To, Subject, Body)");
      setTimeout(() => setSendStatus(""), 3000);
      return;
    }

    setSending(true);
    setSendStatus("");

    try {
      const settings = getSettings();
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: toEmail,
          subject,
          body,
          emailSendingEnabled: settings.emailSendingEnabled,
          googleClientId: settings.googleClientId,
          googleClientSecret: settings.googleClientSecret,
          googleRefreshToken: settings.googleRefreshToken,
          googleSenderEmail: settings.googleSenderEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setSendStatus(`Email sent successfully to ${toEmail}`);
      setTimeout(() => {
        setSendStatus("");
        setToEmail("");
      }, 3000);
    } catch (error) {
      setSendStatus(error.message || "Failed to send email");
      setTimeout(() => setSendStatus(""), 5000);
    } finally {
      setSending(false);
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
            <div className={`flex items-center gap-2 rounded-lg border ${getScoreBg(matchScore)} px-3 py-1.5`}>
              <FaChartLine className={`text-sm ${getScoreColor(matchScore)}`} />
              <span className={`text-lg font-bold ${getScoreColor(matchScore)}`}>
                {matchScore}%
              </span>
            </div>
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
          {/* Score Breakdown */}
          {scoreBreakdown && Object.keys(scoreBreakdown).length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <FaChartLine className="text-blue-600" />
                <h4 className="text-sm font-semibold text-slate-900">Score Breakdown</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">JD Match</span>
                    <span className={`font-semibold ${getScoreColor(scoreBreakdown.jdMatch || 0)}`}>
                      {scoreBreakdown.jdMatch || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        (scoreBreakdown.jdMatch || 0) >= 80 ? 'bg-green-500' :
                        (scoreBreakdown.jdMatch || 0) >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${scoreBreakdown.jdMatch || 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Education</span>
                    <span className={`font-semibold ${getScoreColor(scoreBreakdown.educationMatch || 0)}`}>
                      {scoreBreakdown.educationMatch || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        (scoreBreakdown.educationMatch || 0) >= 80 ? 'bg-green-500' :
                        (scoreBreakdown.educationMatch || 0) >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${scoreBreakdown.educationMatch || 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Experience</span>
                    <span className={`font-semibold ${getScoreColor(scoreBreakdown.experienceMatch || 0)}`}>
                      {scoreBreakdown.experienceMatch || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        (scoreBreakdown.experienceMatch || 0) >= 80 ? 'bg-green-500' :
                        (scoreBreakdown.experienceMatch || 0) >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${scoreBreakdown.experienceMatch || 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Location</span>
                    <span className={`font-semibold ${getScoreColor(scoreBreakdown.locationMatch || 0)}`}>
                      {scoreBreakdown.locationMatch || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        (scoreBreakdown.locationMatch || 0) >= 80 ? 'bg-green-500' :
                        (scoreBreakdown.locationMatch || 0) >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${scoreBreakdown.locationMatch || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Location Info */}
          {(candidateLocation || companyLocation) && (
            <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaMapMarkerAlt className="text-blue-600" />
                <p className="text-xs font-semibold text-blue-900">Location</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-800">
                {candidateLocation && (
                  <span className="font-medium">Candidate: {candidateLocation}</span>
                )}
                {companyLocation && companyLocation !== "Not specified" && (
                  <>
                    <span className="text-blue-400">→</span>
                    <span className="font-medium">Job: {companyLocation}</span>
                  </>
                )}
              </div>
            </section>
          )}

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
                {[...(gaps || []), ...(educationGaps || []), ...(experienceGaps || [])].length > 0 ? (
                  [...(gaps || []), ...(educationGaps || []), ...(experienceGaps || [])].map((item, index) => (
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={sending}
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    <FaPaperPlane />
                    {sending ? "Sending..." : "Send Email"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    <FaCopy />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="rounded-md bg-white p-4 text-sm text-slate-700">
                <div className="flex flex-col gap-2 mb-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">
                      To
                    </label>
                    <input
                      type="email"
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      placeholder="candidate@example.com"
                      className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                    />
                  </div>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-slate-600">
                  <textarea
                    rows={10}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full resize-none border-0 p-0 text-sm text-slate-700 outline-none focus:ring-0"
                  />
                </pre>
              </div>
              {sendStatus && (
                <div className={`mt-2 rounded-md px-3 py-2 text-xs ${
                  sendStatus.includes("successfully") 
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : sendStatus.includes("Settings") || sendStatus.includes("Failed")
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}>
                  {sendStatus}
                  {sendStatus.includes("Settings") && (
                    <Link href="/settings" className="ml-2 underline font-semibold">
                      Go to Settings
                    </Link>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;

