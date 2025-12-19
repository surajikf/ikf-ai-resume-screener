import { useState, useMemo } from "react";
import CandidateCard from "@/components/CandidateCard";
import BulkSendModal from "@/components/BulkSendModal";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaLightbulb,
  FaEnvelope,
  FaWhatsapp,
  FaSpinner,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

const columnConfig = [
  {
    key: "Recommended",
    title: "Recommended",
    icon: <FaCheckCircle className="text-green-500" />,
    accent: "border-green-200 bg-green-50",
  },
  {
    key: "Partially Suitable",
    title: "Partially Suitable",
    icon: <FaHourglassHalf className="text-orange-500" />,
    accent: "border-orange-200 bg-orange-50",
  },
  {
    key: "Not Suitable",
    title: "Not Suitable",
    icon: <FaTimesCircle className="text-red-500" />,
    accent: "border-red-200 bg-red-50",
  },
];

const JiraBoard = ({ evaluations, onSelectCandidate, onViewResume, onBulkSendEmail, onBulkSendWhatsApp, canSendEmail, canSendWhatsApp, settings, evaluatingFiles = new Map() }) => {
  const [bulkSending, setBulkSending] = useState({});
  const [bulkStatus, setBulkStatus] = useState({});
  const [bulkModal, setBulkModal] = useState({ isOpen: false, type: null, candidates: null });
  const [sortBy, setSortBy] = useState('latest'); // 'id', 'experience', 'latest', 'evaluations'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  
  // Create loading placeholders for files being evaluated
  // Safely handle Map - check if it's actually a Map instance
  let loadingEvaluations = [];
  try {
    if (evaluatingFiles && typeof evaluatingFiles === 'object' && evaluatingFiles.size !== undefined && evaluatingFiles.entries) {
      const entries = Array.from(evaluatingFiles.entries());
      loadingEvaluations = entries
        .filter(([_, status]) => status && status.status === 'evaluating')
        .map(([fileName, status]) => ({
          id: `loading-${fileName}`,
          candidateName: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
          verdict: null, // Will show as loading
          matchScore: 0,
          isLoading: true,
          progress: status.progress || 'Evaluating...',
        }));
    }
  } catch (err) {
    // Silently fail if Map operations don't work (e.g., during SSR)
    // Silently fail if Map operations don't work (e.g., during SSR)
    // Error is non-critical, just log for debugging
  }
  
  // Count evaluations per candidate (by email or name)
  const evaluationCounts = useMemo(() => {
    const counts = {};
    evaluations.forEach(evaluation => {
      const key = evaluation.candidateEmail || evaluation.candidateName || evaluation.id;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [evaluations]);
  
  // Sort function
  const sortEvaluations = (items) => {
    const sorted = [...items].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'id':
          aValue = a.databaseId || a.id || 0;
          bValue = b.databaseId || b.id || 0;
          break;
        case 'experience':
          aValue = a.totalExperienceYears || 0;
          bValue = b.totalExperienceYears || 0;
          break;
        case 'latest':
          // Sort by createdAt (latest evaluation date)
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        case 'evaluations':
          // Sort by number of evaluations for this candidate
          const aKey = a.candidateEmail || a.candidateName || a.id;
          const bKey = b.candidateEmail || b.candidateName || b.id;
          aValue = evaluationCounts[aKey] || 1;
          bValue = evaluationCounts[bKey] || 1;
          break;
        default:
          return 0;
      }
      
      // Handle numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
    
    return sorted;
  };
  
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to desc
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };
  
  const grouped = columnConfig.map((column) => ({
    ...column,
    items: sortEvaluations(evaluations.filter((item) => item.verdict === column.key)),
  }));
  
  const hasAnyCandidates = evaluations.length > 0;
  const hasLoadingItems = loadingEvaluations.length > 0;

  const handleBulkEmail = (status, candidates) => {
    if (!canSendEmail) {
      setBulkStatus(prev => ({ ...prev, [status]: "Please enable email sending in Settings" }));
      setTimeout(() => setBulkStatus(prev => {
        const updated = { ...prev };
        delete updated[status];
        return updated;
      }), 5000);
      return;
    }

    const candidatesWithEmail = candidates.filter(c => c.candidateEmail && c.candidateEmail.trim());
    if (candidatesWithEmail.length === 0) {
      setBulkStatus(prev => ({ ...prev, [status]: "No candidates with email addresses in this category" }));
      setTimeout(() => setBulkStatus(prev => {
        const updated = { ...prev };
        delete updated[status];
        return updated;
      }), 5000);
      return;
    }

    setBulkModal({ isOpen: true, type: 'email', candidates: candidatesWithEmail });
  };

  const handleBulkWhatsApp = (status, candidates) => {
    if (!canSendWhatsApp) {
      setBulkStatus(prev => ({ ...prev, [status]: "Please enable WhatsApp sending in Settings" }));
      setTimeout(() => setBulkStatus(prev => {
        const updated = { ...prev };
        delete updated[status];
        return updated;
      }), 5000);
      return;
    }

    const candidatesWithWhatsApp = candidates.filter(c => c.candidateWhatsApp && c.candidateWhatsApp.trim());
    if (candidatesWithWhatsApp.length === 0) {
      setBulkStatus(prev => ({ ...prev, [status]: "No candidates with WhatsApp numbers in this category" }));
      setTimeout(() => setBulkStatus(prev => {
        const updated = { ...prev };
        delete updated[status];
        return updated;
      }), 5000);
      return;
    }

    setBulkModal({ isOpen: true, type: 'whatsapp', candidates: candidatesWithWhatsApp });
  };

  const handleSendIndividual = async (messageData, type) => {
    if (type === 'email') {
      return await onBulkSendEmail([messageData]);
    } else {
      return await onBulkSendWhatsApp([messageData]);
    }
  };

  return (
    <section className="flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white" data-kanban-section>
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Candidates
        </h2>
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-medium">Sort by:</label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none rounded-md border border-slate-300 bg-white px-3 py-1.5 pr-8 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="latest">Latest Evaluation</option>
                <option value="id">ID</option>
                <option value="experience">Experience</option>
                <option value="evaluations">Evaluations</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                {sortOrder === 'asc' ? (
                  <FaSortUp className="text-slate-400 text-xs" />
                ) : (
                  <FaSortDown className="text-slate-400 text-xs" />
                )}
              </div>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center rounded-md border border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? (
                <FaSortUp className="text-xs" />
              ) : (
                <FaSortDown className="text-xs" />
              )}
            </button>
          </div>
          <span className="text-xs text-slate-500">
            {evaluations.length} total
          </span>
        </div>
      </header>

      {!hasAnyCandidates && !hasLoadingItems ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="text-sm text-slate-500">
            No candidates yet. Upload resumes and run evaluation to get started.
          </p>
        </div>
      ) : (
        <div className={`grid gap-4 overflow-x-auto px-6 py-6 ${hasLoadingItems ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {/* Loading Column - Show evaluating resumes */}
          {hasLoadingItems && (
            <div className="flex min-h-[420px] flex-col gap-3 rounded-lg bg-slate-50 p-3">
              <div className="rounded-lg border px-4 py-2.5 border-blue-200 bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaSpinner className="text-blue-500 animate-spin" />
                    <span className="text-sm font-semibold text-slate-700">Evaluating...</span>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {loadingEvaluations.length}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                {loadingEvaluations.map((loadingItem) => (
                  <div
                    key={loadingItem.id}
                    className="flex flex-col gap-2 rounded-lg border border-blue-200 bg-white p-3 opacity-75"
                  >
                    <div className="flex items-center gap-2">
                      <FaSpinner className="text-blue-500 animate-spin" />
                      <h4 className="text-base font-semibold text-slate-700 truncate">
                        {loadingItem.candidateName}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500">{loadingItem.progress}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {grouped.map((column) => (
            <div
              key={column.key}
              className="flex min-h-[420px] flex-col gap-3 rounded-lg bg-slate-50 p-3"
            >
              <div className={`rounded-lg border px-4 py-2.5 ${column.accent}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {column.icon}
                    <span className="text-sm font-semibold text-slate-700">{column.title}</span>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {column.items.length}
                  </span>
                </div>
                {column.items.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => handleBulkEmail(column.key, column.items)}
                      disabled={bulkSending[`${column.key}_email`] || !canSendEmail}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1 text-xs font-medium ${
                        canSendEmail && !bulkSending[`${column.key}_email`]
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      title={canSendEmail ? `Send email to all ${column.title} candidates` : 'Enable email in Settings'}
                    >
                      {bulkSending[`${column.key}_email`] ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaEnvelope />
                      )}
                      Email
                    </button>
                    <button
                      onClick={() => handleBulkWhatsApp(column.key, column.items)}
                      disabled={bulkSending[`${column.key}_whatsapp`] || !canSendWhatsApp}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded px-2 py-1 text-xs font-medium ${
                        canSendWhatsApp && !bulkSending[`${column.key}_whatsapp`]
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      title={canSendWhatsApp ? `Send WhatsApp to all ${column.title} candidates` : 'Enable WhatsApp in Settings'}
                    >
                      {bulkSending[`${column.key}_whatsapp`] ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaWhatsapp />
                      )}
                      WhatsApp
                    </button>
                  </div>
                )}
                {bulkStatus[column.key] && (
                  <div className={`mt-2 text-xs px-2 py-1 rounded ${
                    bulkStatus[column.key].includes('Error') 
                      ? 'bg-red-50 text-red-700' 
                      : bulkStatus[column.key].includes('Sent') || bulkStatus[column.key].includes('Success')
                      ? 'bg-green-50 text-green-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {bulkStatus[column.key]}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3">
                {column.items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-400">
                    Empty
                  </div>
                ) : (
                  column.items.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onSelect={onSelectCandidate}
                      onViewResume={onViewResume}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <BulkSendModal
        isOpen={bulkModal.isOpen}
        onClose={() => setBulkModal({ isOpen: false, type: null, candidates: null })}
        candidates={bulkModal.candidates}
        type={bulkModal.type}
        onSendAll={bulkModal.type === 'email' ? onBulkSendEmail : onBulkSendWhatsApp}
        onSendIndividual={handleSendIndividual}
        canSend={bulkModal.type === 'email' ? canSendEmail : canSendWhatsApp}
        settings={settings}
      />
    </section>
  );
};

export default JiraBoard;

