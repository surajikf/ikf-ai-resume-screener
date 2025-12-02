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
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste or type job description..."
        rows={10}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 hover:text-blue-600">
          <FaFileUpload />
          {uploading ? "Uploading..." : "Upload file"}
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
        <span className="text-xs text-slate-500">{wordCount} words</span>
      </div>
      {statusMessage && (
        <p className="text-xs text-blue-600">{statusMessage}</p>
      )}
    </div>
  );
};

export default JDInputArea;

