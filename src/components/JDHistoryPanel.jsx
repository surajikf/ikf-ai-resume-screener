import {
  FaClock,
  FaSyncAlt,
  FaFolderOpen,
  FaTrash,
  FaFileAlt,
} from "react-icons/fa";

const formatTimestamp = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const JDHistoryPanel = ({ jdHistory, onUseJD, onDeleteJD, onClearJDs }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <FaClock />
          Recent JDs
        </div>
        <button
          type="button"
          onClick={onClearJDs}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-red-600"
        >
          <FaSyncAlt />
          Clear All
        </button>
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto px-4 py-3">
        {jdHistory.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-500">
            <FaFileAlt className="text-slate-300" />
            Saved job descriptions will appear here for one-click reuse.
          </div>
        ) : (
          jdHistory.map((jd) => (
            <div
              key={`${jd.title}-${jd.date}`}
              className="flex flex-col gap-2 rounded-md border border-transparent bg-white px-3 py-2 text-sm shadow-sm transition hover:border-blue-200 hover:shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{jd.title}</p>
                  <p className="text-xs text-slate-500">{formatTimestamp(jd.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUseJD(jd)}
                    className="flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    <FaFolderOpen />
                    Use JD
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteJD(jd)}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-400 transition hover:border-red-200 hover:text-red-600"
                  >
                    <FaTrash />
                    Remove
                  </button>
                </div>
              </div>
              <p className="max-h-14 overflow-hidden text-ellipsis text-xs leading-relaxed text-slate-500">
                {jd.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JDHistoryPanel;

