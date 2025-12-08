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
    <div className="flex flex-col gap-4">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste or type the job description here... Include key requirements, responsibilities, and qualifications."
        rows={12}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
      />
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700">
          <FaFileUpload />
          {uploading ? "Uploading..." : "Upload JD File"}
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{wordCount} words</span>
          <span className="h-4 w-px bg-slate-300"></span>
          <span>{value.length} chars</span>
        </div>
      </div>
      {statusMessage && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default JDInputArea;

