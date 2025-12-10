import { useState } from "react";
import {
  FaFolderOpen,
  FaTrash,
  FaSearch,
  FaClock,
  FaEdit,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { confirm, alert as swalAlert } from "@/utils/swal";

const JDHistoryPanel = ({ jdHistory, onUseJD, onDeleteJD, onClearJDs, onUpdateJD }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [lastUsed, setLastUsed] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("jdLastUsed") || "{}");
    } catch {
      return {};
    }
  });

  // Get stable key for JD (use id or date, not title)
  const getJDKey = (jd) => {
    return jd.id ? `jd-${jd.id}` : `jd-${jd.date || Date.now()}`;
  };

  const handleUseJD = (jd) => {
    // Don't use if currently editing
    const key = getJDKey(jd);
    if (editingId === key) return;
    
    // Track last used (use stable key)
    const updated = { ...lastUsed, [key]: new Date().toISOString() };
    if (typeof window !== "undefined") {
      localStorage.setItem("jdLastUsed", JSON.stringify(updated));
      setLastUsed(updated);
    }
    onUseJD(jd);
  };

  const handleStartEdit = (jd, e) => {
    e.stopPropagation();
    const key = getJDKey(jd);
    setEditingId(key);
    setEditTitle(jd.title);
  };

  const handleSaveEdit = async (jd, e) => {
    e.stopPropagation();
    e.preventDefault();
    const newTitle = editTitle.trim();
    if (!newTitle) {
      await swalAlert("Validation Error", "Title cannot be empty", "warning");
      return;
    }
    
    if (newTitle === jd.title) {
      setEditingId(null);
      setEditTitle("");
      return;
    }

    // Update via callback
    if (onUpdateJD) {
      try {
        const key = getJDKey(jd);
        const oldTimestamp = lastUsed[key];
        
        await onUpdateJD(jd, newTitle);
        
        // Update lastUsed key if title changed (migrate old key to new key)
        if (oldTimestamp && typeof window !== "undefined") {
          const updated = { ...lastUsed };
          delete updated[key];
          const newKey = getJDKey({ ...jd, title: newTitle });
          updated[newKey] = oldTimestamp;
          localStorage.setItem("jdLastUsed", JSON.stringify(updated));
          setLastUsed(updated);
        }
      } catch (error) {
        console.error("Error updating JD:", error);
        await swalAlert("Update Failed", "Failed to update JD title. Please try again.", "error");
        return;
      }
    } else {
      console.error("onUpdateJD callback is not provided");
      await swalAlert("Error", "Update function not available. Please refresh the page.", "error");
      return;
    }
    
    setEditingId(null);
    setEditTitle("");
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle("");
  };

  const filteredJDs = jdHistory.filter((jd) =>
    jd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    jd.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by last used (most recent first), then by date
  const sortedJDs = [...filteredJDs].sort((a, b) => {
    const keyA = getJDKey(a);
    const keyB = getJDKey(b);
    const lastUsedA = lastUsed[keyA];
    const lastUsedB = lastUsed[keyB];
    
    if (lastUsedA && lastUsedB) {
      return new Date(lastUsedB) - new Date(lastUsedA);
    }
    if (lastUsedA) return -1;
    if (lastUsedB) return 1;
    
    // Fallback to date
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });

  const formatLastUsed = (jd) => {
    const key = getJDKey(jd);
    const timestamp = lastUsed[key];
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Saved Job Descriptions {jdHistory.length > 0 && `(${jdHistory.length})`}
          </p>
        </div>
        {jdHistory.length > 0 && (
          <button
            type="button"
            onClick={onClearJDs}
            className="text-xs font-medium text-slate-500 hover:text-red-600"
          >
            Clear All
          </button>
        )}
      </div>

      {jdHistory.length > 0 && (
        <div className="mb-3">
          <div className="relative">
            <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search saved JDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
      )}

      {jdHistory.length === 0 ? (
        <p className="text-xs text-slate-500 italic">No saved job descriptions yet. Save one to access it quickly!</p>
      ) : sortedJDs.length === 0 ? (
        <p className="text-xs text-slate-500 italic">No job descriptions match your search.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedJDs.map((jd) => {
            const key = getJDKey(jd);
            const lastUsedTime = formatLastUsed(jd);
            const isRecentlyUsed = lastUsedTime && (lastUsedTime.includes("m ago") || lastUsedTime === "Just now");
            const isEditing = editingId === key;
            
            return (
              <div
                key={key}
                className={`group relative flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                  isRecentlyUsed
                    ? "border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100"
                    : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50"
                } ${isEditing ? "bg-blue-100 border-blue-400" : ""}`}
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(jd, e);
                        if (e.key === 'Escape') handleCancelEdit(e);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 rounded border border-blue-400 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={(e) => handleSaveEdit(jd, e)}
                      className="text-green-600 hover:text-green-700"
                      title="Save"
                    >
                      <FaCheck className="text-xs" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-red-500 hover:text-red-700"
                      title="Cancel"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUseJD(jd)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(jd, e);
                      }}
                      className="flex items-center gap-2 flex-1 text-left"
                      title="Click to use, double-click to edit"
                    >
                      <FaFolderOpen className={`${isRecentlyUsed ? "text-blue-600" : "text-blue-500"}`} />
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="font-medium text-slate-700 truncate max-w-[200px]">{jd.title}</span>
                        {lastUsedTime && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <FaClock className="text-[8px]" />
                            {lastUsedTime}
                          </span>
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(jd, e);
                      }}
                      className="opacity-70 hover:opacity-100 text-blue-500 hover:text-blue-700"
                      title="Edit title"
                    >
                      <FaEdit className="text-xs" />
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = await confirm(
                          'Delete Job Description?',
                          `Are you sure you want to delete "<strong>${jd.title}</strong>"?<br><br><small>This action cannot be undone.</small>`,
                          'Delete',
                          'Cancel',
                          'warning'
                        );
                        if (confirmed) {
                          onDeleteJD(jd);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JDHistoryPanel;

