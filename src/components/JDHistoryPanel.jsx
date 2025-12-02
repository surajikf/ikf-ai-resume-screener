import {
  FaFolderOpen,
  FaTrash,
} from "react-icons/fa";

const JDHistoryPanel = ({ jdHistory, onUseJD, onDeleteJD, onClearJDs }) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Quick Access</p>
        {jdHistory.length > 0 && (
          <button
            type="button"
            onClick={onClearJDs}
            className="text-xs font-medium text-slate-500 hover:text-red-600 transition"
          >
            Clear All
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {jdHistory.map((jd) => (
          <button
            key={`${jd.title}-${jd.date}`}
            type="button"
            onClick={() => onUseJD(jd)}
            className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:shadow"
          >
            <FaFolderOpen className="text-blue-600" />
            <span className="font-medium text-slate-700">{jd.title}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteJD(jd);
              }}
              className="ml-1 opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700"
            >
              <FaTrash className="text-xs" />
            </button>
          </button>
        ))}
      </div>
    </div>
  );
};

export default JDHistoryPanel;

