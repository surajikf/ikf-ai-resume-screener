import { useState, useEffect } from "react";
import { FaTimes, FaDownload, FaFilePdf, FaFileWord, FaFileAlt } from "react-icons/fa";

const ResumeViewer = ({ evaluationId, candidateName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumeData, setResumeData] = useState(null);

  useEffect(() => {
    if (!evaluationId) {
      setError("No evaluation ID provided");
      setLoading(false);
      return;
    }

    const fetchResume = async () => {
      try {
        const response = await fetch(`/api/resumes/get?evaluationId=${evaluationId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch resume");
        }

        setResumeData(data.data);
      } catch (err) {
        setError(err.message || "Failed to load resume");
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [evaluationId]);

  const handleDownload = () => {
    if (!resumeData) return;

    try {
      // Convert base64 to blob
      const byteCharacters = atob(resumeData.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: resumeData.mimeType });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = resumeData.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to download resume");
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes("pdf")) return <FaFilePdf className="text-red-600" />;
    if (fileType?.includes("word") || fileType?.includes("document")) return <FaFileWord className="text-blue-600" />;
    return <FaFileAlt className="text-slate-600" />;
  };

  const renderResume = () => {
    if (!resumeData) return null;

    const { mimeType, fileContent, fileName } = resumeData;

    if (mimeType === "application/pdf") {
      // For PDF, create a blob URL and embed
      try {
        const byteCharacters = atob(fileContent);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);

        return (
          <iframe
            src={url}
            className="w-full h-full border-0"
            title={fileName}
            onLoad={() => URL.revokeObjectURL(url)}
          />
        );
      } catch (err) {
        return (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>Unable to display PDF. Please download to view.</p>
          </div>
        );
      }
    } else if (mimeType?.includes("text")) {
      // For text files, display as text
      try {
        const text = atob(fileContent);
        return (
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap bg-slate-50 rounded">
            {text}
          </pre>
        );
      } catch (err) {
        return (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>Unable to display file. Please download to view.</p>
          </div>
        );
      }
    } else {
      // For other file types, show download option
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
          <div className="text-6xl">{getFileIcon(mimeType)}</div>
          <p className="text-lg font-medium">{fileName}</p>
          <p className="text-sm">This file type cannot be previewed. Please download to view.</p>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-2">
      <div className="relative flex h-[95vh] max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white border border-slate-200">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            {resumeData && getFileIcon(resumeData.mimeType)}
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Resume: {candidateName || "Candidate"}
              </h3>
              {resumeData && (
                <p className="text-sm text-slate-500">{resumeData.fileName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {resumeData && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                <FaDownload />
                Download
              </button>
            )}
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

        <div className="flex-1 overflow-auto p-4 bg-slate-50">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-slate-600">Loading resume...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 font-medium mb-2">Error loading resume</p>
                <p className="text-sm text-slate-600">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && resumeData && (
            <div className="bg-white rounded-lg shadow-sm h-full min-h-[600px]">
              {renderResume()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeViewer;

