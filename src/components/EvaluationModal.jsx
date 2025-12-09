import { useState, useEffect } from "react";
import Link from "next/link";
import { FaTimes, FaRegEnvelope, FaCopy, FaChartLine, FaMapMarkerAlt, FaPaperPlane, FaWhatsapp } from "react-icons/fa";
import { getSettings, getSettingsFromDatabase } from "@/utils/settingsStorage";

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

const EvaluationModal = ({ candidate, onClose, emailSignature, canSendEmail, canSendWhatsApp }) => {
  // Determine default tab based on available drafts
  const defaultTab = candidate?.whatsappDraft && !candidate?.emailDraft ? "whatsapp" : "email";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  
  // Email state
  const [toEmail, setToEmail] = useState(candidate?.candidateEmail || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  
  // WhatsApp state
  const [toWhatsApp, setToWhatsApp] = useState(candidate?.candidateWhatsApp || "");
  const [whatsappMessage, setWhatsappMessage] = useState("");

  // Update email when candidate changes
  useEffect(() => {
    if (candidate?.candidateEmail) {
      setToEmail(candidate.candidateEmail);
    }
  }, [candidate?.candidateEmail]);

  // Update WhatsApp when candidate changes
  useEffect(() => {
    if (candidate?.candidateWhatsApp) {
      setToWhatsApp(candidate.candidateWhatsApp);
    }
  }, [candidate?.candidateWhatsApp]);

  // Initialize subject and body when candidate/emailDraft changes
  useEffect(() => {
    if (candidate?.emailDraft) {
      setSubject(candidate.emailDraft.subject || "");
      setBody(
        buildEmailBodyWithSignature(
          candidate.emailDraft.body || "",
          emailSignature || ""
        )
      );
    }
  }, [candidate?.emailDraft, emailSignature]);

  // Initialize WhatsApp message when candidate/whatsappDraft changes
  useEffect(() => {
    if (candidate?.whatsappDraft) {
      setWhatsappMessage(candidate.whatsappDraft.message || "");
    }
  }, [candidate?.whatsappDraft]);

  // Update active tab when candidate changes
  useEffect(() => {
    const newDefaultTab = candidate?.whatsappDraft && !candidate?.emailDraft ? "whatsapp" : "email";
    setActiveTab(newDefaultTab);
  }, [candidate?.emailDraft, candidate?.whatsappDraft]);


  if (!candidate) return null;
  
  const {
    candidateName,
    candidateEmail = "",
    candidateWhatsApp = "",
    linkedInUrl = "",
    roleApplied,
    experience,
    workExperience = [],
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
    // Derived fields
    currentDesignation = "",
    currentCompany = "",
    totalExperienceYears = 0,
    relevantExperienceYears = 0,
    numberOfCompanies = 0,
    latestCompanyOne = "",
    latestDesignationOne = "",
    tenureMonthsOne = 0,
    previousCompanyTwo = "",
    previousDesignationTwo = "",
    tenureMonthsTwo = 0,
    freeTextNotesShort = "",
    emailType = "",
  } = candidate;

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

  const handleCopyWhatsApp = async () => {
    if (!whatsappMessage) return;
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy WhatsApp message", error);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!canSendWhatsApp) {
      setSendStatus("Please enable WhatsApp messaging in Settings and configure WhatsApp API credentials.");
      setTimeout(() => setSendStatus(""), 5000);
      return;
    }

    if (!toWhatsApp || !whatsappMessage) {
      setSendStatus("Please fill in all fields (To, Message)");
      setTimeout(() => setSendStatus(""), 3000);
      return;
    }

    // Validate and clean phone number format before sending
    let phoneTrimmed = toWhatsApp.trim();
    
    // Remove all non-digit characters except + at the start
    const hasPlus = phoneTrimmed.startsWith("+");
    let digitsOnly = phoneTrimmed.replace(/\D/g, "");
    
    // If it had + and starts with 91, keep it as +91 format
    if (hasPlus && digitsOnly.startsWith("91") && digitsOnly.length === 12) {
      phoneTrimmed = "+" + digitsOnly;
    } else if (digitsOnly.startsWith("91") && digitsOnly.length === 12) {
      // 12 digits starting with 91, use as is
      phoneTrimmed = digitsOnly;
    } else if (digitsOnly.length === 10) {
      // Exactly 10 digits, use as is
      phoneTrimmed = digitsOnly;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
      // 11 digits starting with 0, remove the 0
      phoneTrimmed = digitsOnly.substring(1);
    } else {
      // Try to extract last 10 digits
      if (digitsOnly.length > 10) {
        phoneTrimmed = digitsOnly.slice(-10);
      } else {
        phoneTrimmed = digitsOnly;
      }
    }
    
    // Final validation
    const finalDigits = phoneTrimmed.replace(/\D/g, "");
    if (!finalDigits || finalDigits.length < 10) {
      setSendStatus("Please enter a valid 10-digit phone number (e.g., 9272850850) or with country code (+919272850850)");
      setTimeout(() => setSendStatus(""), 4000);
      return;
    }

    setSending(true);
    setSendStatus("");

    try {
      // Get settings - try database first, fallback to cached/localStorage
      let settings = getSettings();
      
      // Try to get fresh settings from database
      try {
        const dbSettings = await getSettingsFromDatabase();
        if (dbSettings) {
          settings = dbSettings;
        }
      } catch (err) {
        // Use cached settings if database fetch fails
        console.log('Using cached settings:', err);
      }
      
      console.log('[EvaluationModal] Sending WhatsApp to:', phoneTrimmed, 'Original:', toWhatsApp);
      console.log('[EvaluationModal] Settings check:', {
        whatsappSendingEnabled: settings.whatsappSendingEnabled,
        hasApiKey: !!settings.whatsappApiKey,
        hasPhoneNumberId: !!settings.whatsappPhoneNumberId,
        hasCompanyId: !!settings.whatsappCompanyId,
        hasTemplateName: !!settings.whatsappTemplateName,
        hasMessage: !!whatsappMessage,
        messageLength: whatsappMessage?.length
      });
      
      const response = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: String(phoneTrimmed), // Ensure it's always a string
          message: whatsappMessage,
          candidateName: candidate?.candidateName || "Candidate",
          evaluationId: candidate?.id || candidate?.databaseId || null,
          whatsappSendingEnabled: settings.whatsappSendingEnabled,
          whatsappApiKey: settings.whatsappApiKey,
          whatsappApiUrl: settings.whatsappApiUrl,
          whatsappPhoneNumberId: settings.whatsappPhoneNumberId,
          whatsappCompanyId: settings.whatsappCompanyId,
          whatsappTemplateName: settings.whatsappTemplateName,
          whatsappLanguage: settings.whatsappLanguage,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('[EvaluationModal] Failed to parse response as JSON:', {
          status: response.status,
          statusText: response.statusText,
          responseText: text,
          error: jsonError
        });
        throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
      }

      if (!response.ok) {
        // Log full error details for debugging
        console.error('[EvaluationModal] WhatsApp send error:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          message: data.message,
          details: data.details,
          missing: data.missing,
          requestDetails: data.requestDetails,
          fullResponse: JSON.stringify(data, null, 2)
        });
        
        // Also log the details object expanded
        if (data.details) {
          console.error('[EvaluationModal] Error details expanded:', data.details);
          if (data.details.errors) {
            console.error('[EvaluationModal] MyOperator errors object:', JSON.stringify(data.details.errors, null, 2));
            // Try to extract specific field errors
            if (typeof data.details.errors === 'object' && !Array.isArray(data.details.errors)) {
              Object.entries(data.details.errors).forEach(([field, error]) => {
                console.error(`[EvaluationModal] Field error - ${field}:`, error);
              });
            }
          }
          if (data.details.code) {
            console.error('[EvaluationModal] MyOperator error code:', data.details.code, '- This is a validation error from MyOperator API');
          }
        }
        
        // Provide more user-friendly error messages
        const errorMsg = data.error || data.message || "Failed to send WhatsApp message";
        if (errorMsg.includes("Invalid phone number") || errorMsg.includes("Invalid input")) {
          throw new Error(`Invalid phone number format. Please enter a 10-digit number (e.g., 9272850850) or with country code (+919272850850)`);
        }
        // Show the actual error message from the server
        throw new Error(errorMsg);
      }

      setSendStatus(`WhatsApp message sent successfully to ${phoneTrimmed}`);
      setTimeout(() => {
        setSendStatus("");
        setToWhatsApp("");
      }, 3000);
    } catch (error) {
      setSendStatus(error.message || "Failed to send WhatsApp message");
      setTimeout(() => setSendStatus(""), 5000);
    } finally {
      setSending(false);
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
      // Get settings - try database first, fallback to cached/localStorage
      let settings = getSettings();
      
      // Try to get fresh settings from database
      try {
        const dbSettings = await getSettingsFromDatabase();
        if (dbSettings) {
          settings = dbSettings;
        }
      } catch (err) {
        // Use cached settings if database fetch fails
        console.log('Using cached settings:', err);
      }
      
      // Validate that we have email credentials
      if (!settings.gmailEmail || !settings.gmailAppPassword) {
        if (!settings.googleClientId || !settings.googleClientSecret || !settings.googleRefreshToken || !settings.googleSenderEmail) {
          setSendStatus("Missing email credentials. Please configure Gmail email + App Password in Settings.");
          setTimeout(() => setSendStatus(""), 5000);
          setSending(false);
          return;
        }
      }
      
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: toEmail,
          subject,
          body,
          evaluationId: candidate?.id || candidate?.databaseId || null,
          emailSendingEnabled: settings.emailSendingEnabled,
          gmailEmail: settings.gmailEmail,
          gmailAppPassword: settings.gmailAppPassword,
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4 py-2">
      <div className="relative flex h-[95vh] max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white border border-slate-200">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 flex-shrink-0">
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
              className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>
        </header>

        {/* Status Message - Fixed at top for visibility */}
        {sendStatus && (
          <div className={`mx-4 mt-3 mb-2 rounded-md px-3 py-2 text-xs flex-shrink-0 ${
            sendStatus.includes("successfully") 
              ? "bg-green-50 text-green-700 border border-green-200"
              : sendStatus.includes("Settings") || sendStatus.includes("API") || sendStatus.includes("Failed")
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
            <div className="flex items-start gap-2">
              <span className="flex-1">{sendStatus}</span>
              {(sendStatus.includes("Settings") || sendStatus.includes("API")) && (
                <Link 
                  href="/settings" 
                  className="ml-2 underline font-semibold text-red-800 hover:text-red-900 whitespace-nowrap"
                >
                  Go to Settings →
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSendStatus("")}
                className="flex-shrink-0 text-slate-500 hover:text-slate-700"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
          {/* Score Breakdown - Comprehensive Stats */}
          <section className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
            <div className="flex items-center gap-2 mb-4">
              <FaChartLine className="text-blue-600" />
              <h4 className="text-sm font-semibold text-slate-900">Score Breakdown & Candidate Stats</h4>
            </div>
            
            {/* Score Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">JD Match Score</span>
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
                  <span className="text-slate-600">Education Match</span>
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
                  <span className="text-slate-600">Relevant Experience Score</span>
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
                  <span className="text-slate-600">Location Fit Score</span>
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
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Stability Score</span>
                  <span className={`font-semibold ${getScoreColor(scoreBreakdown.stabilityScore || 0)}`}>
                    {scoreBreakdown.stabilityScore || 0}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      (scoreBreakdown.stabilityScore || 0) >= 80 ? 'bg-green-500' :
                      (scoreBreakdown.stabilityScore || 0) >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${scoreBreakdown.stabilityScore || 0}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Overall Fitment Percent</span>
                  <span className={`font-semibold ${getScoreColor(matchScore)}`}>
                    {matchScore}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      matchScore >= 80 ? 'bg-green-500' :
                      matchScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${matchScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Candidate Information Grid */}
            <div className="border-t border-slate-200 pt-3 mt-3">
              <h5 className="text-xs font-semibold text-slate-700 mb-3">Candidate Information</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Candidate Name:</span>
                  <span className="font-medium text-slate-900">{candidateName || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Email ID:</span>
                  <span className="font-medium text-slate-900">{candidateEmail || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Mobile Number:</span>
                  <span className="font-medium text-slate-900">{candidateWhatsApp || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">LinkedIn URL:</span>
                  {linkedInUrl ? (
                    <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-700 truncate max-w-[150px]">
                      View Profile
                    </a>
                  ) : (
                    <span className="font-medium text-slate-400">N/A</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Designation:</span>
                  <span className="font-medium text-slate-900">{currentDesignation || latestDesignationOne || roleApplied || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Company:</span>
                  <span className="font-medium text-slate-900">{currentCompany || latestCompanyOne || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Current City:</span>
                  <span className="font-medium text-slate-900">{candidateLocation || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Email Type:</span>
                  <span className="font-medium text-slate-900">{emailType || (verdict === "Recommended" ? "Shortlist" : verdict === "Partially Suitable" ? "Entry-Level" : "Rejection")}</span>
                </div>
              </div>
            </div>

            {/* Experience Details */}
            <div className="border-t border-slate-200 pt-3 mt-3">
              <h5 className="text-xs font-semibold text-slate-700 mb-3">Experience Details</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Experience (Years):</span>
                  <span className="font-medium text-slate-900">{totalExperienceYears > 0 ? totalExperienceYears : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Relevant Experience (Years):</span>
                  <span className="font-medium text-slate-900">{relevantExperienceYears > 0 ? relevantExperienceYears : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Number of Companies:</span>
                  <span className="font-medium text-slate-900">{numberOfCompanies > 0 ? numberOfCompanies : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Latest Company Tenure (Months):</span>
                  <span className="font-medium text-slate-900">{tenureMonthsOne > 0 ? `${tenureMonthsOne} (${Math.round(tenureMonthsOne / 12 * 10) / 10}Y)` : "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Latest Companies */}
            {(latestCompanyOne || previousCompanyTwo) && (
              <div className="border-t border-slate-200 pt-3 mt-3">
                <h5 className="text-xs font-semibold text-slate-700 mb-3">Company History</h5>
                <div className="space-y-2 text-xs">
                  {latestCompanyOne && (
                    <div className="flex justify-between items-center bg-blue-50 rounded px-2 py-1.5">
                      <div>
                        <span className="text-slate-600">Latest Company One:</span>
                        <span className="font-medium text-slate-900 ml-2">{latestCompanyOne}</span>
                        {latestDesignationOne && (
                          <span className="text-slate-500 ml-2">({latestDesignationOne})</span>
                        )}
                      </div>
                      {tenureMonthsOne > 0 && (
                        <span className="text-slate-600">{Math.round(tenureMonthsOne / 12 * 10) / 10}Y</span>
                      )}
                    </div>
                  )}
                  {previousCompanyTwo && (
                    <div className="flex justify-between items-center bg-slate-50 rounded px-2 py-1.5">
                      <div>
                        <span className="text-slate-600">Previous Company Two:</span>
                        <span className="font-medium text-slate-900 ml-2">{previousCompanyTwo}</span>
                        {previousDesignationTwo && (
                          <span className="text-slate-500 ml-2">({previousDesignationTwo})</span>
                        )}
                      </div>
                      {tenureMonthsTwo > 0 && (
                        <span className="text-slate-600">{Math.round(tenureMonthsTwo / 12 * 10) / 10}Y</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Free Text Notes */}
            {freeTextNotesShort && (
              <div className="border-t border-slate-200 pt-3 mt-3">
                <h5 className="text-xs font-semibold text-slate-700 mb-2">Notes</h5>
                <p className="text-xs text-slate-600 bg-amber-50 rounded px-2 py-1.5">{freeTextNotesShort}</p>
              </div>
            )}
          </section>

          {/* Location Info */}
          {(candidateLocation || companyLocation) && (
            <section className="rounded-lg border border-blue-200 bg-blue-50 p-3">
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

          {(workExperience.length > 0 || experience) && (
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500 mb-2">Work Experience Details</p>
              {workExperience.length > 0 ? (
                <div className="space-y-2">
                  {workExperience.map((exp, index) => {
                    const isTotal = exp.companyName === "Total Experience";
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between py-1.5 px-2 rounded ${
                          isTotal
                            ? "bg-blue-50 border border-blue-200 font-semibold"
                            : "bg-white border border-slate-200"
                        }`}
                      >
                        <div className="flex-1">
                          <span className={`text-sm ${isTotal ? "text-blue-900" : "text-slate-900"}`}>
                            {exp.companyName}
                          </span>
                          {exp.role && !isTotal && (
                            <span className="text-xs text-slate-500 ml-2">({exp.role})</span>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${isTotal ? "text-blue-700" : "text-slate-700"}`}>
                          {exp.duration}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-700">{experience}</p>
              )}
            </section>
          )}
          {betterSuitedFocus && (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-700 mb-1">Better Suited For</p>
              <p className="text-sm text-amber-800">{betterSuitedFocus}</p>
            </section>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Strengths</p>
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
              <p className="text-xs font-semibold text-slate-700 mb-2">Gaps</p>
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

          {(emailDraft || candidate?.whatsappDraft) && (
            <section className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              {/* Tabs */}
              <div className="flex items-center gap-2 mb-3 border-b border-blue-200">
                {emailDraft && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("email")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                      activeTab === "email"
                        ? "text-blue-700 border-b-2 border-blue-700"
                        : "text-blue-500 hover:text-blue-700"
                    }`}
                  >
                    <FaRegEnvelope />
                    Email
                  </button>
                )}
                {candidate?.whatsappDraft && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("whatsapp")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                      activeTab === "whatsapp"
                        ? "text-blue-700 border-b-2 border-blue-700"
                        : "text-blue-500 hover:text-blue-700"
                    }`}
                  >
                    <FaWhatsapp />
                    WhatsApp
                  </button>
                )}
              </div>

              {/* Email Tab Content */}
              {activeTab === "email" && emailDraft && (
                <>
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
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    <FaPaperPlane />
                    {sending ? "Sending..." : "Send Email"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
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
                        rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full resize-none border-0 p-0 text-sm text-slate-700 outline-none focus:ring-0"
                  />
                </pre>
              </div>
                </>
              )}

              {/* WhatsApp Tab Content */}
              {activeTab === "whatsapp" && candidate?.whatsappDraft && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-blue-700">
                      <FaWhatsapp />
                      <h4 className="text-sm font-semibold">WhatsApp Message</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSendWhatsApp}
                        disabled={sending}
                        className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        <FaPaperPlane />
                        {sending ? "Sending..." : "Send WhatsApp"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyWhatsApp}
                        className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        <FaCopy />
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-md bg-white p-3 text-sm text-slate-700">
                    <div className="flex flex-col gap-2 mb-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">
                          To (WhatsApp Number)
                        </label>
                        <input
                          type="text"
                          value={toWhatsApp}
                          onChange={(e) => setToWhatsApp(e.target.value)}
                          placeholder="9307768467"
                          className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        />
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-slate-600">
                      <textarea
                        rows={6}
                        value={whatsappMessage}
                        onChange={(e) => setWhatsappMessage(e.target.value)}
                        className="w-full resize-none border-0 p-0 text-sm text-slate-700 outline-none focus:ring-0"
                      />
                    </pre>
                </div>
                </>
              )}

            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;

