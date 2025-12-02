import { Inter } from "next/font/google";
import Head from "next/head";
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

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jdHistory, setJdHistory] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  useEffect(() => {
    setJdHistory(getJDs());
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

      const evaluation = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        candidateName: summary.candidateName || "Candidate",
        roleApplied: summary.roleApplied || jobTitle || "Role",
        experience: summary.experienceCtcNoticeLocation || "",
        strengths: arrayFrom(summary.keyStrengths),
        gaps: arrayFrom(summary.gaps),
        verdict: summary.verdict || "Not Suitable",
        betterSuitedFocus: summary.betterSuitedFocus || "",
        emailDraft,
        jobTitle: data?.metadata?.jobDescriptionTitle || jobTitle,
        jdLink: data?.metadata?.jdLink || "",
        createdAt: new Date().toISOString(),
      };

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
      <main className={`relative min-h-screen bg-slate-50 ${inter.className}`}>

        <header className="mx-auto mb-8 mt-8 flex w-full max-w-6xl flex-col gap-4 px-4 sm:mt-12">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Resume Screener
            </h1>
            <span className="text-xs font-medium text-slate-500">
              {evaluations.length} candidate{evaluations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16">
          {evaluations.length > 0 && (
            <StatusSummary counts={verdictCounts} lastEvaluated={latestEvaluationTime} />
          )}
          
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
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {globalError}
            </div>
          )}

          {evaluations.length > 0 && (
            <JiraBoard
              evaluations={boardEvaluations}
              onSelectCandidate={setSelectedEvaluation}
            />
          )}
        </div>
        {selectedEvaluation && (
          <EvaluationModal
            candidate={selectedEvaluation}
            onClose={() => setSelectedEvaluation(null)}
          />
        )}
      </main>
    </>
  );
}
