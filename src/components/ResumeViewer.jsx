import { useState, useEffect, useRef } from "react";
import { FaTimes, FaDownload, FaFilePdf, FaFileWord, FaFileAlt } from "react-icons/fa";

const ResumeViewer = ({ evaluationId, candidateId, candidateName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumeData, setResumeData] = useState(null);
  const [pdfError, setPdfError] = useState(false);
  const blobUrlRef = useRef(null); // Track blob URL for cleanup

  useEffect(() => {
    if (!evaluationId) {
      setError("No evaluation ID provided");
      setLoading(false);
      return;
    }

    // Reset state when evaluationId changes
    setLoading(true);
    setError("");
    setPdfError(false);
    setResumeData(null);

    const fetchResume = async () => {
      try {
        console.log('[ResumeViewer] Fetching resume for evaluationId:', evaluationId, 'candidateId:', candidateId);
        
        // First, test if resume exists
        const testResponse = await fetch(`/api/resumes/test?evaluationId=${evaluationId}`);
        const testData = await testResponse.json();
        
        if (!testData.success) {
          if (testData.message?.includes('No resume found')) {
            throw new Error('Resume file was not saved for this evaluation. Please re-evaluate this candidate to save the resume file.');
          }
        }
        
        // Fetch resume metadata and URL - include candidateId for validation
        const url = candidateId 
          ? `/api/resumes/get?evaluationId=${evaluationId}&candidateId=${candidateId}`
          : `/api/resumes/get?evaluationId=${evaluationId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || "Failed to fetch resume";
          throw new Error(errorMsg);
        }

        // Check if response is JSON (with URL) or binary (streaming)
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          // Supabase Storage URL response
          const data = await response.json();
          
          if (!data.success || !data.data) {
            throw new Error(data.error || "Failed to fetch resume");
          }

          console.log('[ResumeViewer] Resume loaded with URL:', {
            fileName: data.data.fileName,
            source: data.data.source,
            hasUrl: !!data.data.fileUrl,
          });

          setResumeData({
            fileName: data.data.fileName,
            fileType: data.data.fileType,
            fileSize: data.data.fileSize,
            fileUrl: data.data.fileUrl, // Direct URL - best practice
            mimeType: data.data.mimeType,
            source: data.data.source,
          });
        } else {
          // Binary stream response - create blob URL
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url; // Store for cleanup
          
          // Get filename from Content-Disposition header
          const contentDisposition = response.headers.get('content-disposition');
          let fileName = 'resume.pdf';
          if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match) fileName = match[1];
          }

          console.log('[ResumeViewer] Resume loaded as blob:', {
            fileName,
            size: blob.size,
            type: blob.type,
          });

          setResumeData({
            fileName,
            fileType: contentType || 'application/pdf',
            fileSize: blob.size,
            fileUrl: url, // Blob URL
            mimeType: contentType || 'application/pdf',
            source: 'database_blob',
          });
        }
        
        setPdfError(false);
      } catch (err) {
        console.error('[ResumeViewer] Error loading resume:', err);
        setError(err.message || "Failed to load resume");
        setPdfError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
    
    // Cleanup blob URL on unmount or when evaluationId changes
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [evaluationId, candidateId]); // Depend on both evaluationId and candidateId

  const handleDownload = async () => {
    if (!resumeData || !resumeData.fileUrl) {
      setError("Resume data is not available for download");
      return;
    }

    try {
      // If it's a blob URL, download directly
      if (resumeData.source === 'database_blob') {
        const link = document.createElement("a");
        link.href = resumeData.fileUrl;
        link.download = resumeData.fileName || 'resume.pdf';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For Supabase Storage URL, fetch and download
        const response = await fetch(resumeData.fileUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = resumeData.fileName || 'resume.pdf';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Download failed:", err);
      setError(`Failed to download resume: ${err.message}`);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes("pdf")) return <FaFilePdf className="text-red-600" />;
    if (fileType?.includes("word") || fileType?.includes("document")) return <FaFileWord className="text-blue-600" />;
    return <FaFileAlt className="text-slate-600" />;
  };

  const renderResume = () => {
    if (!resumeData || !resumeData.fileUrl) return null;

    const { mimeType, fileUrl, fileName } = resumeData;

    if (mimeType === "application/pdf") {
      // Best Practice: Use iframe with direct URL (most compatible)
      return (
        <div className="w-full h-full relative">
          <iframe
            key={fileUrl} // Force remount when URL changes to prevent flickering
            src={fileUrl}
            type="application/pdf"
            className="w-full h-full border-0"
            style={{ minHeight: '600px' }}
            title={`Resume: ${fileName}`}
            onError={() => {
              console.error('PDF iframe error');
              setPdfError(true);
            }}
            onLoad={() => {
              console.log('PDF iframe loaded successfully');
              setPdfError(false);
            }}
          />
          
          {/* Fallback overlay if PDF fails to load */}
          {pdfError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white gap-4 z-10">
              <p className="text-lg font-medium text-slate-700">Unable to display PDF in browser</p>
              <p className="text-sm text-slate-500">The PDF file exists but cannot be displayed. Please download it to view.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <FaDownload />
                  Download Resume
                </button>
                <button
                  onClick={() => window.open(fileUrl, '_blank')}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          )}
        </div>
      );
    } else if (mimeType?.includes("text")) {
      // For text files, fetch and display as text
      return (
        <div className="p-4">
          <p className="text-sm text-slate-600 mb-2">Text file preview not available. Please download to view.</p>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FaDownload />
            Download File
          </button>
        </div>
      );
    } else {
      // For other file types, show download option
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
          <div className="text-6xl">{getFileIcon(mimeType)}</div>
          <p className="text-lg font-medium">{fileName}</p>
          <p className="text-sm">This file type cannot be previewed. Please download to view.</p>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FaDownload />
            Download File
          </button>
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
              <div className="text-center max-w-md px-4">
                <div className="mb-4">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-red-600 font-semibold mb-2 text-lg">Resume Not Available</p>
                <p className="text-sm text-slate-600 mb-4">{error}</p>
                {error.includes('not saved') || error.includes('not found') || error.includes('missing') ? (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium mb-2">💡 How to Fix:</p>
                    <ol className="text-sm text-blue-700 text-left list-decimal list-inside space-y-1">
                      <li>Go back to the main page</li>
                      <li>Upload the same resume file</li>
                      <li>Run the evaluation again</li>
                      <li>The resume will be automatically saved</li>
                      <li>Then try viewing it again</li>
                    </ol>
                  </div>
                ) : (
                  <button
                    onClick={handleDownload}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <FaDownload />
                    Try Download Instead
                  </button>
                )}
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
