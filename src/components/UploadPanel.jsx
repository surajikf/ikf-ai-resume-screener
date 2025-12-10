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
  onUpdateJD,
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
    setStatus(`Starting evaluation of ${resumeFiles.length} resume(s)... Results will appear below as they complete.`);

    // Run all evaluations in parallel - results will appear one by one
    const evaluationPromises = resumeFiles.map(file => 
      onEvaluate({ resumeFile: file }).catch(error => {
        return { file, error: error.message };
      })
    );

    // Wait for all to complete (but results appear as they finish)
    const results = await Promise.allSettled(evaluationPromises);
    
    const failures = results
      .filter(result => result.status === 'rejected' || (result.value && result.value.error))
      .map(result => ({
        file: result.status === 'rejected' ? { name: 'Unknown' } : result.value.file,
        message: result.status === 'rejected' ? result.reason?.message || 'Unknown error' : result.value.error
      }));

    if (failures.length === 0) {
      setStatus(`All ${resumeFiles.length} resume(s) evaluated successfully!`);
      setTimeout(() => setStatus(""), 3000);
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

  const canEvaluate = resumeFiles.length > 0 && jobDescription.trim() && !loading;

  return (
      <div className="space-y-4">
      {/* Step 1: Upload Resumes */}
      <div className="rounded-lg bg-white border border-slate-200 overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
                1
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Upload Resumes</h2>
                <p className="text-xs text-slate-600">Select one or multiple resume files</p>
              </div>
            </div>
            {resumeFiles.length > 0 && (
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                {resumeFiles.length} file{resumeFiles.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        <div className="p-4">
          <label
            htmlFor="resume-upload"
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed ${
              resumeFiles.length > 0
                ? 'border-blue-300 bg-blue-50'
                : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
            } px-4 py-8`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <FaUpload className="text-xl text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-900">
                {resumeFiles.length > 0
                  ? `${resumeFiles.length} file${resumeFiles.length > 1 ? 's' : ''} selected`
                  : 'Click to upload or drag and drop'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                PDF, DOCX, or TXT files
              </p>
            </div>
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

          {resumeFiles.length > 0 && (
            <div className="mt-6 space-y-2">
              {resumeFiles.map((file) => (
                <div
                  key={`${file.name}-${file.size}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file)}
                    className="ml-4 flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <FaTrashAlt />
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleClearFiles}
                className="text-sm font-medium text-slate-600 hover:text-red-600"
              >
                Clear all files
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Job Description */}
      <div className="rounded-lg bg-white border border-slate-200 overflow-hidden">
        <div className="bg-purple-50 px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                jobDescription.trim() ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                2
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Job Description</h2>
                <p className="text-xs text-slate-600">Paste or upload the job description</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {jobDescription.trim() && (
                <button
                  type="button"
                  onClick={onSaveJD}
                  className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                  title="Save this job description for quick access"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save JD
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4">
          {jdHistory.length > 0 && (
            <div className="mb-4">
              <JDHistoryPanel
                jdHistory={jdHistory}
                onUseJD={onUseJD}
                onDeleteJD={onDeleteJD}
                onClearJDs={onClearJDs}
                onUpdateJD={onUpdateJD}
              />
            </div>
          )}
          
          <JDInputArea
            value={jobDescription}
            onChange={onJobDescriptionChange}
            onFileUpload={onJDFileUpload}
          />
          
          {jobTitle && (
            <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2">
              <p className="text-xs text-slate-500 mb-1">Detected Job Title</p>
              <p className="text-sm font-semibold text-slate-900">{jobTitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Evaluate Button */}
      <div className="sticky bottom-4 z-20">
        <div className="rounded-lg bg-white border border-slate-200 p-4">
          {error && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {!error && status && (
            <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {status}
            </div>
          )}
          
          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={!canEvaluate || loading}
            className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white ${
              canEvaluate && !loading
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Evaluating {resumeFiles.length} resume{resumeFiles.length > 1 ? 's' : ''}...</span>
              </>
            ) : (
              <>
                <FaPlay className="text-sm" />
                <span>Evaluate {resumeFiles.length > 0 ? `${resumeFiles.length} ` : ''}Resume{resumeFiles.length !== 1 ? 's' : ''}</span>
              </>
            )}
          </button>
          
          {!canEvaluate && (
            <p className="mt-3 text-center text-xs text-slate-500">
              {resumeFiles.length === 0 && !jobDescription.trim() && 'Upload resumes and add job description to continue'}
              {resumeFiles.length === 0 && jobDescription.trim() && 'Upload at least one resume to continue'}
              {resumeFiles.length > 0 && !jobDescription.trim() && 'Add a job description to continue'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPanel;

