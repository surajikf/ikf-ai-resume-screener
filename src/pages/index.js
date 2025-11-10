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
      <main className={`relative min-h-screen bg-slate-100 ${inter.className}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[520px] max-w-5xl bg-gradient-to-br from-blue-100 via-transparent to-purple-100 opacity-70 blur-3xl" />

        <header className="mx-auto mb-10 mt-12 flex w-full max-w-5xl flex-col gap-6 px-4 sm:mt-16">
          <nav className="flex items-center justify-between rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs text-slate-500 shadow-sm backdrop-blur">
            <span className="font-semibold tracking-[0.2em] text-blue-700">
              IKF • AI Hiring Desk
            </span>
            <span className="hidden gap-4 font-medium text-slate-500 sm:flex">
              <a href="#workspace" className="hover:text-blue-600">
                Workspace
              </a>
              <a href="#board" className="hover:text-blue-600">
                Kanban
              </a>
              <a href="#activity" className="hover:text-blue-600">
                Activity
              </a>
            </span>
          </nav>
          <div className="flex flex-col gap-3 text-center">
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              IKF AI Resume Screener
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
              Upload resumes, reuse job descriptions, and let GPT-4o file each candidate into the right lane with structured summaries and ready-to-send HR emails.
            </p>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-16">
          <div id="activity" className="flex flex-col gap-4">
            <StatusSummary counts={verdictCounts} lastEvaluated={latestEvaluationTime} />
          </div>
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

          <section id="board" className="flex flex-col gap-4">
            {globalError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {globalError}
              </p>
            )}
            <p className="text-sm text-slate-500">
              Once the AI completes an evaluation, the candidate appears below grouped by verdict. Select any card to open the detailed summary and the personalised email draft.
            </p>
            <JiraBoard
              evaluations={boardEvaluations}
              onSelectCandidate={setSelectedEvaluation}
            />
          </section>
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
