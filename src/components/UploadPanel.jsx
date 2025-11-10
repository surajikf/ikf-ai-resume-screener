import { useMemo, useState, useRef } from "react";
import {
  FaUpload,
  FaTrashAlt,
  FaPlay,
  FaInfoCircle,
  FaCheckCircle,
} from "react-icons/fa";
import JDInputArea from "@/components/JDInputArea";
import JDHistoryPanel from "@/components/JDHistoryPanel";

const UploadPanel = ({
  jobDescription,
  onJobDescriptionChange,
  jobTitle,
  onSaveJD,
  jdHistory,
  onUseJD,
  onDeleteJD,
  onClearJDs,
  onEvaluate,
  onJDFileUpload,
  loading,
}) => {
  const [resumeFiles, setResumeFiles] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const fileInputRef = useRef(null);

  const formatFileSize = (size) => {
    if (!size && size !== 0) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setResumeFiles((prev) => {
      const existingKeys = new Set(prev.map((file) => `${file.name}-${file.size}`));
      const nextFiles = [
        ...prev,
        ...files.filter((file) => !existingKeys.has(`${file.name}-${file.size}`)),
      ];
      return nextFiles;
    });
    setError("");
    setStatus("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (targetFile) => {
    setResumeFiles((prev) =>
      prev.filter(
        (file) => !(file.name === targetFile.name && file.size === targetFile.size),
      ),
    );
    setStatus("");
  };

  const handleRunEvaluation = async () => {
    if (resumeFiles.length === 0) {
      setError("Please upload at least one resume before running the evaluation.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please provide a job description before running the evaluation.");
      return;
    }

    setError("");
    setStatus(`Evaluating ${resumeFiles.length} resume(s)...`);

    const failures = [];

    for (const file of resumeFiles) {
      try {
        await onEvaluate({ resumeFile: file });
      } catch (evaluationError) {
        failures.push({ file, message: evaluationError.message });
      }
    }

    if (failures.length === 0) {
      setStatus(`Successfully evaluated ${resumeFiles.length} resume(s).`);
    } else if (failures.length === resumeFiles.length) {
      setError(
        `Failed to evaluate all resumes. Last error: ${
          failures[failures.length - 1].message || "Unknown error"
        }`,
      );
      setStatus("");
    } else {
      setError(
        `${failures.length} of ${resumeFiles.length} resume(s) failed. Last error: ${
          failures[failures.length - 1].message || "Unknown error"
        }`,
      );
      setStatus("Partial success. Please review the errors and retry failed resumes.");
    }

    setResumeFiles([]);
  };

  const handleClearFiles = () => {
    setResumeFiles([]);
    setStatus("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const stepData = useMemo(
    () => [
      {
        id: 1,
        title: "Upload resumes",
        description: "Add one or many candidate files in PDF, DOCX or TXT formats.",
        done: resumeFiles.length > 0,
      },
      {
        id: 2,
        title: "Shape the job description",
        description: "Paste or upload the JD and keep reusable versions handy.",
        done: !!jobDescription.trim(),
      },
      {
        id: 3,
        title: "Launch AI evaluation",
        description: "We’ll triage each resume, summarise findings, and draft HR emails.",
        done: false,
      },
    ],
    [resumeFiles.length, jobDescription],
  );

  return (
    <section className="w-full rounded-2xl bg-white shadow-xl ring-1 ring-slate-100">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-6">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Evaluation Workspace
        </span>
        <h2 className="text-2xl font-semibold text-slate-900">
          Upload resumes & prepare the JD
        </h2>
        <p className="text-sm text-slate-500">
          Bring the latest resumes and the precise job description together before running the AI evaluation.
        </p>
      </div>

      <div className="flex flex-col gap-4 border-b border-dashed border-slate-200 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          How it works
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {stepData.map((step) => (
            <div
              key={step.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                  {step.id}
                </span>
                {step.done ? (
                  <FaCheckCircle className="text-emerald-500" aria-hidden />
                ) : (
                  <FaInfoCircle className="text-blue-500" aria-hidden />
                )}
                <span>{step.title}</span>
              </div>
              <p className="text-xs text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-slate-900">Resume Files</h3>
              <p className="text-sm text-slate-600">
                Drag & drop or browse to add single or multiple resumes. Supported formats: PDF, DOCX, TXT.
              </p>
            </div>
            <label
              htmlFor="resume-upload"
              className="mt-4 flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
            >
              <span className="flex items-center gap-2">
                <FaUpload className="text-blue-600" />
                {resumeFiles.length > 0
                  ? `${resumeFiles.length} file${resumeFiles.length > 1 ? "s" : ""} ready`
                  : "Select resume files"}
              </span>
              <input
                id="resume-upload"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <div className="mt-4 space-y-2">
              {resumeFiles.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">
                  <p>No resumes added yet.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Tip: add multiple files at once to let the AI process them in one run.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {resumeFiles.map((file) => (
                    <div
                      key={`${file.name}-${file.size}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file)}
                        className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 transition hover:border-red-200 hover:text-red-600"
                      >
                        <FaTrashAlt />
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearFiles}
                    className="text-xs font-medium text-blue-600 underline-offset-4 transition hover:text-blue-700 hover:underline"
                  >
                    Clear all files
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-3 text-xs text-blue-700">
              <p className="font-semibold uppercase tracking-wide">Heads up</p>
              <p className="mt-1">
                Resumes remain on your machine and are only streamed to OpenAI for the chosen evaluation. Nothing is stored by IKF after the call completes.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Detected Job Title
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {jobTitle || "Add the JD to auto-detect the role"}
                </p>
                <p className="text-sm text-slate-500">
                  The first meaningful line of the JD is used as the pipeline title.
                </p>
              </div>

              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              {!error && status && (
                <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  {status}
                </p>
              )}

              <button
                type="button"
                onClick={handleRunEvaluation}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                <FaPlay />
                {loading ? "Evaluating..." : `Run Evaluation${resumeFiles.length > 1 ? "s" : ""}`}
              </button>
              <p className="text-xs text-slate-400">
                Average turnaround: 5-7 seconds per resume. We’ll notify you if an evaluation needs your attention.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Job Description</h3>
                <p className="text-sm text-slate-500">
                  Paste the JD, upload a JD file, or reuse a recent version.
                </p>
              </div>
              <button
                type="button"
                onClick={onSaveJD}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Save to Recents
              </button>
            </div>

            <div className="mt-4">
              <JDInputArea
                value={jobDescription}
                onChange={onJobDescriptionChange}
                onFileUpload={onJDFileUpload}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Recent Job Descriptions
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Access the last 10 JDs you saved. Use them to quickly launch new screenings.
            </p>
            <div className="mt-4">
              <JDHistoryPanel
                jdHistory={jdHistory}
                onUseJD={onUseJD}
                onDeleteJD={onDeleteJD}
                onClearJDs={onClearJDs}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UploadPanel;

