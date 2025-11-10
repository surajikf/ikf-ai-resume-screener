import { useMemo, useState } from "react";
import { FaFileUpload, FaInfoCircle } from "react-icons/fa";

const JDInputArea = ({ value, onChange, onFileUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const wordCount = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [value]);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !onFileUpload) return;

    setUploading(true);
    setStatusMessage(`Processing ${file.name}...`);

    try {
      const text = await onFileUpload(file);
      if (text) {
        onChange(text);
        setStatusMessage(`Loaded job description from ${file.name}`);
      } else {
        setStatusMessage("Unable to read the selected file.");
      }
    } catch (error) {
      setStatusMessage(error.message || "Failed to read the selected file.");
    } finally {
      setUploading(false);
      event.target.value = "";
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <div className="flex items-center gap-2">
          <FaInfoCircle aria-hidden />
          <span>
            Aim for 150-250 words highlighting responsibilities, stakeholders, KPIs, and must-have skills.
          </span>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste the job description here..."
        rows={8}
        className="min-h-[200px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
        <span>{value.length} characters</span>
      </div>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition hover:border-blue-500 hover:text-blue-900">
        <FaFileUpload />
        {uploading ? "Uploading..." : "Upload JD file"}
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </label>
      {statusMessage && (
        <p className="text-xs text-slate-500">{statusMessage}</p>
      )}
    </div>
  );
};

export default JDInputArea;

