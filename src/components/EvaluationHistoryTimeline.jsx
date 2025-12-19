import { useState } from "react";
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
} from "react-icons/fa";

const verdictStyles = {
  Recommended: {
    badge: "bg-green-100 text-green-700",
    border: "border-green-200",
    icon: FaCheckCircle,
    iconColor: "text-green-600",
  },
  "Partially Suitable": {
    badge: "bg-orange-100 text-orange-700",
    border: "border-orange-200",
    icon: FaExclamationCircle,
    iconColor: "text-orange-600",
  },
  "Not Suitable": {
    badge: "bg-red-100 text-red-700",
    border: "border-red-200",
    icon: FaTimesCircle,
    iconColor: "text-red-600",
  },
};

const getScoreColor = (score) => {
  if (!score && score !== 0) return "text-slate-600";
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-orange-600";
  return "text-red-600";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch {
    return { date: "N/A", time: "" };
  }
};

const EvaluationHistoryTimeline = ({ evaluations, onViewResume }) => {
  const [expandedEvaluations, setExpandedEvaluations] = useState({});

  const toggleEvaluation = (evaluationId) => {
    setExpandedEvaluations((prev) => ({
      ...prev,
      [evaluationId]: !prev[evaluationId],
    }));
  };

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg p-6 text-center text-slate-500">
        No evaluations found.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>

      <div className="space-y-4">
        {evaluations.map((evaluation, index) => {
          const styles = verdictStyles[evaluation.verdict] || verdictStyles["Not Suitable"];
          const VerdictIcon = styles.icon;
          const scoreColor = getScoreColor(evaluation.matchScore);
          const dateInfo = formatDate(evaluation.createdAt);
          const isExpanded = expandedEvaluations[evaluation.evaluationId];

          return (
            <div key={evaluation.evaluationId} className="relative pl-12">
              {/* Timeline dot */}
              <div
                className={`absolute left-3 top-2 w-4 h-4 rounded-full border-2 border-white ${styles.border} ${styles.badge} flex items-center justify-center z-10`}
              >
                <VerdictIcon className={`text-xs ${styles.iconColor}`} />
              </div>

              {/* Evaluation Card */}
              <div
                className={`bg-white border ${styles.border} rounded-lg p-4 hover:shadow-md transition-shadow`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                        {evaluation.verdict}
                      </span>
                      <div className={`flex items-center gap-1.5 rounded-lg border bg-slate-50 px-2.5 py-1`}>
                        <FaChartLine className={`text-xs ${scoreColor}`} />
                        <span className={`text-sm font-bold ${scoreColor}`}>
                          {evaluation.matchScore || 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <FaCalendarAlt className="text-slate-400" />
                        <span>{dateInfo.date}</span>
                        {dateInfo.time && <span className="text-slate-400">• {dateInfo.time}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Applied */}
                {evaluation.roleApplied && (
                  <div className="mb-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-sm">
                      <FaBriefcase className="text-slate-400" />
                      <span className="text-slate-600">Role:</span>
                      <span className="font-medium text-slate-900">{evaluation.roleApplied}</span>
                    </div>
                  </div>
                )}

                {/* Job Description */}
                {evaluation.jobDescription && (
                  <div className="mb-3 pb-3 border-b border-slate-100">
                    <div className="text-sm">
                      <div className="text-slate-600 mb-1">Job Description:</div>
                      <div className="font-medium text-slate-900">
                        {evaluation.jobDescription.title || "Untitled JD"}
                      </div>
                      {evaluation.jobDescription.link && (
                        <a
                          href={evaluation.jobDescription.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1 mt-1"
                        >
                          View JD Link
                          <FaExternalLinkAlt className="text-xs" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Expandable Details */}
                <button
                  onClick={() => toggleEvaluation(evaluation.evaluationId)}
                  className="w-full flex items-center justify-between text-sm text-slate-600 hover:text-slate-900 mb-2"
                >
                  <span>{isExpanded ? "Hide" : "Show"} Details</span>
                  {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                    {/* Score Breakdown */}
                    {evaluation.scoreBreakdown && Object.keys(evaluation.scoreBreakdown).length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                          Score Breakdown
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {evaluation.scoreBreakdown.jdMatch !== undefined && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              JD: {evaluation.scoreBreakdown.jdMatch}
                            </span>
                          )}
                          {evaluation.scoreBreakdown.educationMatch !== undefined && (
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                              Education: {evaluation.scoreBreakdown.educationMatch}
                            </span>
                          )}
                          {evaluation.scoreBreakdown.experienceMatch !== undefined && (
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                              Experience: {evaluation.scoreBreakdown.experienceMatch}
                            </span>
                          )}
                          {evaluation.scoreBreakdown.locationMatch !== undefined && (
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                              Location: {evaluation.scoreBreakdown.locationMatch}
                            </span>
                          )}
                          {evaluation.scoreBreakdown.stabilityScore !== undefined && (
                            <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                              Stability: {evaluation.scoreBreakdown.stabilityScore}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Key Strengths */}
                    {evaluation.keyStrengths && evaluation.keyStrengths.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">
                          Key Strengths
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                          {evaluation.keyStrengths.map((strength, idx) => (
                            <li key={idx}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Gaps */}
                    {(evaluation.gaps?.length > 0 ||
                      evaluation.educationGaps?.length > 0 ||
                      evaluation.experienceGaps?.length > 0) && (
                      <div>
                        <div className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wide">
                          Gaps
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                          {evaluation.gaps?.map((gap, idx) => (
                            <li key={idx}>{gap}</li>
                          ))}
                          {evaluation.educationGaps?.map((gap, idx) => (
                            <li key={`edu-${idx}`}>
                              <span className="font-medium">Education:</span> {gap}
                            </li>
                          ))}
                          {evaluation.experienceGaps?.map((gap, idx) => (
                            <li key={`exp-${idx}`}>
                              <span className="font-medium">Experience:</span> {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Better Suited Focus */}
                    {evaluation.betterSuitedFocus && (
                      <div>
                        <div className="text-xs font-semibold text-orange-700 mb-2 uppercase tracking-wide">
                          Better Suited For
                        </div>
                        <p className="text-sm text-slate-600">{evaluation.betterSuitedFocus}</p>
                      </div>
                    )}

                    {/* Experience/CTC/Notice/Location */}
                    {evaluation.experienceCtcNoticeLocation && (
                      <div>
                        <div className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                          Additional Information
                        </div>
                        <p className="text-sm text-slate-600">
                          {evaluation.experienceCtcNoticeLocation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                  {evaluation.hasResume && (
                    <button
                      onClick={() => onViewResume(evaluation)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      <FaFilePdf />
                      View Resume
                    </button>
                  )}
                  {!evaluation.hasResume && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-sm">
                      <FaFilePdf />
                      Resume Not Available
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EvaluationHistoryTimeline;

