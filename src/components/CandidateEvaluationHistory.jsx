import { useState } from 'react';
import {
  FaCalendarAlt,
  FaBriefcase,
  FaChartLine,
  FaFilePdf,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimesCircle,
} from 'react-icons/fa';

const verdictStyles = {
  Recommended: {
    badge: 'bg-green-100 text-green-700',
    icon: FaCheckCircle,
    iconColor: 'text-green-600',
  },
  'Partially Suitable': {
    badge: 'bg-orange-100 text-orange-700',
    icon: FaExclamationCircle,
    iconColor: 'text-orange-600',
  },
  'Not Suitable': {
    badge: 'bg-red-100 text-red-700',
    icon: FaTimesCircle,
    iconColor: 'text-red-600',
  },
};

const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

export default function CandidateEvaluationHistory({ evaluations, onViewResume, onSelectEvaluation }) {
  const [expandedEvaluations, setExpandedEvaluations] = useState({});

  const toggleEvaluation = (evaluationId) => {
    setExpandedEvaluations((prev) => ({
      ...prev,
      [evaluationId]: !prev[evaluationId],
    }));
  };

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Evaluation History</h2>
        <div className="bg-slate-50 rounded-lg p-6 text-center text-slate-500">
          No evaluations found for this candidate.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900">
          Evaluation History
        </h2>
        <span className="text-sm text-slate-500">{evaluations.length} total</span>
      </div>

      <div className="space-y-2">
        {evaluations.map((evaluation, index) => {
          const styles = verdictStyles[evaluation.verdict] || verdictStyles['Not Suitable'];
          const VerdictIcon = styles.icon;
          const scoreColor = getScoreColor(evaluation.matchScore);
          const isExpanded = expandedEvaluations[evaluation.id];

          return (
            <div
              key={evaluation.id || index}
              className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
            >
              <div
                className="p-3 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                onClick={() => toggleEvaluation(evaluation.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <VerdictIcon className={`text-lg ${styles.iconColor} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {evaluation.roleApplied || evaluation.jobTitle || 'Unknown Role'}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles.badge}`}>
                          {evaluation.verdict}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt />
                          {formatDate(evaluation.createdAt)}
                        </span>
                        <span className={`flex items-center gap-1 font-semibold ${scoreColor}`}>
                          <FaChartLine />
                          {evaluation.matchScore}% Match
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-white border-t border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    {evaluation.strengths && evaluation.strengths.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {evaluation.strengths.slice(0, 3).map((strength, idx) => (
                            <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="text-green-600 mt-1">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(evaluation.gaps?.length > 0 || evaluation.experienceGaps?.length > 0) && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                          Gaps
                        </h4>
                        <ul className="space-y-1">
                          {[...(evaluation.gaps || []), ...(evaluation.experienceGaps || [])]
                            .slice(0, 3)
                            .map((gap, idx) => (
                              <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="text-red-600 mt-1">•</span>
                                <span>{gap}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvaluation(evaluation);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewResume(evaluation);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <FaFilePdf className="text-xs" />
                      Resume
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

