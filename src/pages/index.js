import { Inter } from "next/font/google";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import UploadPanel from "@/components/UploadPanel";
import JiraBoard from "@/components/JiraBoard";
import EvaluationModal from "@/components/EvaluationModal";
import StatusSummary from "@/components/StatusSummary";
import {
  saveJD,
  getJDs,
  deleteJD,
  clearJDs,
} from "@/utils/jdStorage";
import {
  saveCandidateEvaluation,
  findPreviousEvaluation,
} from "@/utils/candidateHistory";
import { getSettings } from "@/utils/settingsStorage";

const inter = Inter({ subsets: ["latin"] });

cccc

  useEffect(() => {
    setJdHistory(getJDs());
  }, []);

  useEffect(() => {
    // Load UI settings (email signature, etc.)
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    const detectedTitle =
      jobDescription
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.length > 0) || "";
    setJobTitle(detectedTitle);
  }, [jobDescription]);

  const handleSaveJD = () => {
    if (!jobDescription.trim()) {
      setGlobalError("Cannot save an empty job description.");
      return;
    }

    let title = jobTitle;

    if (!title) {
      const response =
        typeof window !== "undefined"
          ? window.prompt("Name this job description:", "Untitled JD")
          : "Untitled JD";
      if (!response) return;
      title = response.trim();
    }

    saveJD(title, jobDescription);
    setJdHistory(getJDs());
    setGlobalError("");
  };

  const handleUseJD = (jd) => {
    setJobDescription(jd.content);
    setGlobalError("");
  };

  const handleDeleteJD = (jd) => {
    deleteJD(jd.title);
    setJdHistory(getJDs());
  };

  const handleClearJDs = () => {
    clearJDs();
    setJdHistory([]);
  };

  const arrayFrom = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value
        .split(/\n|;|•|,/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const handleJDFileUpload = async (file) => {
    const formData = new FormData();
    formData.append("jdFile", file);

    const response = await fetch("/api/parse-jd", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Unable to process the job description file.");
    }

    const data = await response.json();
    if (data?.text) {
      setJobDescription(data.text);
      return data.text;
    }

    throw new Error("Unable to read the uploaded job description file.");
  };

  const handleEvaluate = async ({ resumeFile }) => {
    setLoading(true);
    setGlobalError("");

    try {
      const formData = new FormData();
      formData.append("jobDescription", jobDescription);
      formData.append("resume", resumeFile);

      const response = await fetch("/api/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Unable to evaluate resume.");
      }

      const data = await response.json();
      const summary = data?.result?.evaluationSummary || {};
      const emailDraft = data?.result?.emailDraft || null;

      const candidateName = summary.candidateName || "Candidate";
      const roleApplied = summary.roleApplied || jobTitle || "Role";
      
      // Check for previous evaluation
      const previousEval = findPreviousEvaluation(candidateName);
      if (previousEval) {
        const prevDate = new Date(previousEval.createdAt).toLocaleDateString();
        setDuplicateWarning({
          candidateName,
          previousRole: previousEval.roleApplied,
          previousDate: prevDate,
        });
        // Clear warning after 10 seconds
        setTimeout(() => setDuplicateWarning(null), 10000);
      }

      const evaluation = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        candidateName,
        candidateEmail: summary.candidateEmail || "",
        roleApplied,
        experience: summary.experienceCtcNoticeLocation || "",
        candidateLocation: summary.candidateLocation || "",
        companyLocation: summary.companyLocation || "",
        strengths: arrayFrom(summary.keyStrengths),
        gaps: arrayFrom(summary.gaps),
        educationGaps: arrayFrom(summary.educationGaps),
        experienceGaps: arrayFrom(summary.experienceGaps),
        verdict: summary.verdict || "Not Suitable",
        betterSuitedFocus: summary.betterSuitedFocus || "",
        matchScore: summary.matchScore || 0,
        scoreBreakdown: summary.scoreBreakdown || {
          jdMatch: 0,
          educationMatch: 0,
          experienceMatch: 0,
          locationMatch: 0,
        },
        emailDraft,
        jobTitle: data?.metadata?.jobDescriptionTitle || jobTitle,
        jdLink: data?.metadata?.jdLink || "",
        createdAt: new Date().toISOString(),
      };

      // Save candidate to history
      saveCandidateEvaluation(candidateName, roleApplied, evaluation.id, evaluation.createdAt);

      setEvaluations((prev) => [evaluation, ...prev]);
      saveJD(evaluation.jobTitle || jobTitle || "Job Description", jobDescription);
      setJdHistory(getJDs());

      return evaluation;
    } catch (error) {
      setGlobalError(error.message || "Unable to evaluate resume.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const boardEvaluations = useMemo(() => evaluations, [evaluations]);
  const verdictCounts = useMemo(() => {
    return evaluations.reduce(
      (acc, evaluation) => {
        const verdictKey = evaluation.verdict || "Not Suitable";
        acc[verdictKey] = (acc[verdictKey] || 0) + 1;
        return acc;
      },
      { Recommended: 0, "Partially Suitable": 0, "Not Suitable": 0 },
    );
  }, [evaluations]);
  const latestEvaluationTime = useMemo(
    () => evaluations[0]?.createdAt || null,
    [evaluations],
  );

  return (
    <>
      <Head>
        <title>IKF AI Resume Screener</title>
      </Head>
      <main className={`relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 ${inter.className}`}>
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Resume Screener
                  </h1>
                  {evaluations.length > 0 && (
                    <p className="text-sm text-slate-500 mt-1">
                      {evaluations.length} candidate{evaluations.length !== 1 ? 's' : ''} evaluated
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {evaluations.length > 0 && (
                  <StatusSummary counts={verdictCounts} lastEvaluated={latestEvaluationTime} />
                )}
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-8 pb-16">
            {/* Main Workflow */}
            <UploadPanel
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              jobTitle={jobTitle}
              onSaveJD={handleSaveJD}
              jdHistory={jdHistory}
              onUseJD={handleUseJD}
              onDeleteJD={handleDeleteJD}
              onClearJDs={handleClearJDs}
              onEvaluate={handleEvaluate}
              onJDFileUpload={handleJDFileUpload}
              loading={loading}
            />

            {globalError && (
              <div className="rounded-xl border-2 border-red-300 bg-red-50 px-6 py-4 text-sm text-red-700 shadow-sm">
                <strong>Error:</strong> {globalError}
              </div>
            )}

            {duplicateWarning && (
              <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-6 py-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 mb-1">
                      Duplicate Candidate Detected
                    </p>
                    <p className="text-sm text-amber-800">
                      <strong>{duplicateWarning.candidateName}</strong> was previously evaluated on{" "}
                      <strong>{duplicateWarning.previousDate}</strong> for the position:{" "}
                      <strong>{duplicateWarning.previousRole}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDuplicateWarning(null)}
                    className="text-amber-600 hover:text-amber-800 transition"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Results Section */}
            {evaluations.length > 0 && (
              <div className="mt-4">
                <JiraBoard
                  evaluations={boardEvaluations}
                  onSelectCandidate={setSelectedEvaluation}
                />
              </div>
            )}
          </div>
        </div>
        {selectedEvaluation && (
          <EvaluationModal
            candidate={selectedEvaluation}
            onClose={() => setSelectedEvaluation(null)}
            emailSignature={settings?.emailSignature}
            canSendEmail={!!settings?.emailSendingEnabled}
          />
        )}
      </main>
    </>
  );
}
