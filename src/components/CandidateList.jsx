import { memo } from "react";
import EmptyState from "@/components/EmptyState";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaBuilding,
  FaChartLine,
  FaLinkedin,
  FaCalendarAlt,
  FaChevronRight,
  FaEye,
  FaFilePdf,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

const verdictStyles = {
  Recommended: {
    badge: "bg-green-100 text-green-700 border-green-200",
    text: "text-green-700",
  },
  "Partially Suitable": {
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    text: "text-orange-700",
  },
  "Not Suitable": {
    badge: "bg-red-100 text-red-700 border-red-200",
    text: "text-red-700",
  },
};

const getScoreColor = (score) => {
  if (!score && score !== 0) return "text-slate-600";
  if (score >= 80) return "text-green-600 font-semibold";
  if (score >= 50) return "text-orange-600 font-semibold";
  return "text-red-600 font-semibold";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const CandidateList = memo(({ candidates, onSelectCandidate, onViewResume, loading, sortBy, sortOrder, onSortChange }) => {
  // Map column names to sortBy values
  const columnSortMap = {
    'id': 'candidate_id',
    'candidate': 'candidate_name',
    'contact': 'candidate_email',
    'current_role': 'current_designation',
    'experience': 'total_experience_years',
    'latest_evaluation': 'latest_evaluation',
    'evaluations': 'total_evaluations',
  };

  const handleSort = (columnKey) => {
    if (!onSortChange || !columnSortMap[columnKey]) return;
    
    const newSortBy = columnSortMap[columnKey];
    
    // If clicking the same column, toggle order; otherwise set to DESC
    if (sortBy === newSortBy) {
      onSortChange(newSortBy, sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      onSortChange(newSortBy, 'DESC');
    }
  };

  const getSortIcon = (columnKey) => {
    const sortValue = columnSortMap[columnKey];
    if (!sortValue || sortBy !== sortValue) {
      return <FaSort className="text-slate-400 text-xs ml-1" />;
    }
    return sortOrder === 'ASC' 
      ? <FaSortUp className="text-blue-600 text-xs ml-1" />
      : <FaSortDown className="text-blue-600 text-xs ml-1" />;
  };

  const isSortable = (columnKey) => {
    return columnSortMap[columnKey] && onSortChange;
  };
  if (loading && candidates.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th 
                  className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-16 ${
                    isSortable('id') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                  } ${sortBy === columnSortMap['id'] ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('id')}
                  title={isSortable('id') ? 'Click to sort by ID' : ''}
                >
                  <div className="flex items-center">
                    ID
                    {getSortIcon('id')}
                  </div>
                </th>
                <th 
                  className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[15%] ${
                    isSortable('candidate') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                  } ${sortBy === columnSortMap['candidate'] ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('candidate')}
                  title={isSortable('candidate') ? 'Click to sort by Candidate Name' : ''}
                >
                  <div className="flex items-center">
                    Candidate
                    {getSortIcon('candidate')}
                  </div>
                </th>
                <th 
                  className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[15%] ${
                    isSortable('contact') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                  } ${sortBy === columnSortMap['contact'] ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('contact')}
                  title={isSortable('contact') ? 'Click to sort by Contact' : ''}
                >
                  <div className="flex items-center">
                    Contact
                    {getSortIcon('contact')}
                  </div>
                </th>
                <th 
                  className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[15%] ${
                    isSortable('current_role') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                  } ${sortBy === columnSortMap['current_role'] ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('current_role')}
                  title={isSortable('current_role') ? 'Click to sort by Current Role' : ''}
                >
                  <div className="flex items-center">
                    Current Role
                    {getSortIcon('current_role')}
                  </div>
                </th>
                <th 
                  className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[10%] ${
                    isSortable('experience') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                  } ${sortBy === columnSortMap['experience'] ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('experience')}
                  title={isSortable('experience') ? 'Click to sort by Experience' : ''}
                >
                  <div className="flex items-center">
                    Experience
                    {getSortIcon('experience')}
                  </div>
                </th>
                <th 
                  className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[15%] ${
                    isSortable('latest_evaluation') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                  } ${sortBy === columnSortMap['latest_evaluation'] ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('latest_evaluation')}
                  title={isSortable('latest_evaluation') ? 'Click to sort by Latest Evaluation' : ''}
                >
                  <div className="flex items-center">
                    Latest Evaluation
                    {getSortIcon('latest_evaluation')}
                  </div>
                </th>
                <th 
                  className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[8%] ${
                    isSortable('evaluations') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                  } ${sortBy === columnSortMap['evaluations'] ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSort('evaluations')}
                  title={isSortable('evaluations') ? 'Click to sort by Evaluations' : ''}
                >
                  <div className="flex items-center">
                    Evaluations
                    {getSortIcon('evaluations')}
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[12%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-3 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-8"></div></td>
                  <td className="px-3 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                  <td className="px-3 py-4"><div className="h-4 bg-slate-200 rounded w-40"></div></td>
                  <td className="px-3 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-3 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="px-3 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-3 py-4"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                  <td className="px-3 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden w-full">
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-full table-fixed">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th 
                className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-16 ${
                  isSortable('id') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                } ${sortBy === columnSortMap['id'] ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('id')}
                title={isSortable('id') ? 'Click to sort by ID' : ''}
              >
                <div className="flex items-center">
                  ID
                  {getSortIcon('id')}
                </div>
              </th>
              <th 
                className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[15%] ${
                  isSortable('candidate') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                } ${sortBy === columnSortMap['candidate'] ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('candidate')}
                title={isSortable('candidate') ? 'Click to sort by Candidate Name' : ''}
              >
                <div className="flex items-center">
                  Candidate
                  {getSortIcon('candidate')}
                </div>
              </th>
              <th 
                className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[15%] ${
                  isSortable('contact') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                } ${sortBy === columnSortMap['contact'] ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('contact')}
                title={isSortable('contact') ? 'Click to sort by Contact' : ''}
              >
                <div className="flex items-center">
                  Contact
                  {getSortIcon('contact')}
                </div>
              </th>
              <th 
                className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[15%] ${
                  isSortable('current_role') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                } ${sortBy === columnSortMap['current_role'] ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('current_role')}
                title={isSortable('current_role') ? 'Click to sort by Current Role' : ''}
              >
                <div className="flex items-center">
                  Current Role
                  {getSortIcon('current_role')}
                </div>
              </th>
              <th 
                className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[10%] ${
                  isSortable('experience') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                } ${sortBy === columnSortMap['experience'] ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('experience')}
                title={isSortable('experience') ? 'Click to sort by Experience' : ''}
              >
                <div className="flex items-center">
                  Experience
                  {getSortIcon('experience')}
                </div>
              </th>
              <th 
                className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[15%] ${
                  isSortable('latest_evaluation') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                } ${sortBy === columnSortMap['latest_evaluation'] ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('latest_evaluation')}
                title={isSortable('latest_evaluation') ? 'Click to sort by Latest Evaluation' : ''}
              >
                <div className="flex items-center">
                  Latest Evaluation
                  {getSortIcon('latest_evaluation')}
                </div>
              </th>
              <th 
                className={`px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[8%] ${
                  isSortable('evaluations') ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                } ${sortBy === columnSortMap['evaluations'] ? 'bg-blue-50' : ''}`}
                onClick={() => handleSort('evaluations')}
                title={isSortable('evaluations') ? 'Click to sort by Evaluations' : ''}
              >
                <div className="flex items-center">
                  Evaluations
                  {getSortIcon('evaluations')}
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-[12%]">
                Actions
              </th>
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {candidates && Array.isArray(candidates) && candidates.filter(c => c != null).map((candidate) => {
              const latestEvaluation = candidate.latestEvaluation;
              const styles = latestEvaluation?.verdict
                ? verdictStyles[latestEvaluation.verdict] || verdictStyles["Not Suitable"]
                : { badge: "bg-slate-100 text-slate-700 border-slate-200", text: "text-slate-700" };
              const matchScore = latestEvaluation?.matchScore || 0;
              const scoreColor = getScoreColor(matchScore);

              return (
                <tr
                  key={candidate.candidateId}
                  className="hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => onSelectCandidate(candidate)}
                >
                  {/* ID */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-semibold text-slate-600">
                      #{candidate.candidateId}
                    </span>
                  </td>

                  {/* Candidate Name */}
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <FaUser className="text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">
                            {candidate.candidateName || "Unknown Candidate"}
                          </h3>
                          {candidate.linkedInUrl && (
                            <a
                              href={candidate.linkedInUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-shrink-0 text-blue-600 hover:text-blue-700"
                              title="LinkedIn Profile"
                            >
                              <FaLinkedin className="text-sm" />
                            </a>
                          )}
                        </div>
                        {candidate.candidateLocation && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                            <FaMapMarkerAlt className="text-slate-400" />
                            <span className="truncate">{candidate.candidateLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="px-3 py-4">
                    <div className="space-y-1">
                      {candidate.candidateEmail && (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <FaEnvelope className="text-slate-400 flex-shrink-0 text-xs" />
                          <span className="truncate" title={candidate.candidateEmail}>
                            {candidate.candidateEmail}
                          </span>
                        </div>
                      )}
                      {candidate.candidateWhatsApp && (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <FaPhone className="text-slate-400 flex-shrink-0 text-xs" />
                          <span>{candidate.candidateWhatsApp}</span>
                        </div>
                      )}
                      {!candidate.candidateEmail && !candidate.candidateWhatsApp && (
                        <span className="text-xs text-slate-400">No contact info</span>
                      )}
                    </div>
                  </td>

                  {/* Current Role */}
                  <td className="px-3 py-4">
                    <div className="space-y-1">
                      {candidate.currentDesignation && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <FaBriefcase className="text-slate-400 flex-shrink-0 text-xs" />
                          <span className="truncate" title={candidate.currentDesignation}>
                            {candidate.currentDesignation}
                          </span>
                        </div>
                      )}
                      {candidate.currentCompany && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <FaBuilding className="text-slate-400 flex-shrink-0 text-xs" />
                          <span className="truncate" title={candidate.currentCompany}>
                            {candidate.currentCompany}
                          </span>
                        </div>
                      )}
                      {!candidate.currentDesignation && !candidate.currentCompany && (
                        <span className="text-xs text-slate-400">Not specified</span>
                      )}
                    </div>
                  </td>

                  {/* Experience */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-700">
                      {candidate.totalExperienceYears > 0 ? (
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt className="text-slate-400 text-xs" />
                          <span className="font-medium">
                            {candidate.totalExperienceYears.toFixed(1)}Y
                          </span>
                          {candidate.numberOfCompanies > 0 && (
                            <span className="text-slate-400 text-xs">
                              • {candidate.numberOfCompanies} Co
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </div>
                  </td>

                  {/* Latest Evaluation */}
                  <td className="px-3 py-4">
                    {latestEvaluation ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles.badge}`}>
                            {latestEvaluation.verdict}
                          </span>
                          <span className={`text-sm ${scoreColor}`}>
                            {matchScore}%
                          </span>
                        </div>
                        {latestEvaluation.roleApplied && (
                          <div className="text-xs text-slate-600 truncate" title={latestEvaluation.roleApplied}>
                            {latestEvaluation.roleApplied}
                          </div>
                        )}
                        {candidate.latestEvaluationDate && (
                          <div className="text-xs text-slate-400">
                            {formatDate(candidate.latestEvaluationDate)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No evaluations</span>
                    )}
                  </td>

                  {/* Total Evaluations */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-sm text-slate-700">
                      <FaChartLine className="text-slate-400 text-xs" />
                      <span className="font-medium">{candidate.totalEvaluations || 0}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCandidate(candidate);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                        title="View Details"
                      >
                        <FaEye className="text-xs" />
                        View
                      </button>
                      {latestEvaluation?.hasResume && onViewResume && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewResume(candidate);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
                          title="View Resume"
                        >
                          <FaFilePdf className="text-xs" />
                          Resume
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

CandidateList.displayName = 'CandidateList';

export default CandidateList;

