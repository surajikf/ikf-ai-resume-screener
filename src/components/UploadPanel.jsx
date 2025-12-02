import { useState, useRef } from "react";
import {
  FaUpload,
  FaTrashAlt,
  FaPlay,
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

  return (
    <section className="w-full rounded-xl bg-white shadow-sm border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Upload & Evaluate
        </h2>
      </div>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Resumes</h3>
            <label
              htmlFor="resume-upload"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm font-medium text-slate-600 transition hover:border-blue-500 hover:bg-blue-50"
            >
              <FaUpload className="text-blue-600" />
              {resumeFiles.length > 0
                ? `${resumeFiles.length} file${resumeFiles.length > 1 ? "s" : ""} selected`
                : "Upload resumes (PDF, DOCX, TXT)"}
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
              {resumeFiles.length > 0 && (
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
                    className="text-xs font-medium text-slate-500 hover:text-red-600"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4">
              {jobTitle && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Job Title</p>
                  <p className="text-sm font-semibold text-slate-900">{jobTitle}</p>
                </div>
              )}

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
                disabled={loading || resumeFiles.length === 0 || !jobDescription.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FaPlay />
                {loading ? "Evaluating..." : "Evaluate"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Job Description</h3>
              <button
                type="button"
                onClick={onSaveJD}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Save
              </button>
            </div>

            <JDInputArea
              value={jobDescription}
              onChange={onJobDescriptionChange}
              onFileUpload={onJDFileUpload}
            />
          </div>

          {jdHistory.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent JDs</h3>
              <JDHistoryPanel
                jdHistory={jdHistory}
                onUseJD={onUseJD}
                onDeleteJD={onDeleteJD}
                onClearJDs={onClearJDs}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UploadPanel;

