import {
  FaEnvelopeOpenText,
  FaUser,
  FaMapMarkerAlt,
  FaBriefcase,
  FaChartLine,
  FaLinkedin,
  FaBuilding,
  FaCalendarAlt,
  FaFilePdf,
} from "react-icons/fa";

const verdictStyles = {
  Recommended: {
    badge: "bg-green-100 text-green-700",
    border: "border-green-200",
    scoreColor: "text-green-600",
    scoreBg: "bg-green-50",
  },
  "Partially Suitable": {
    badge: "bg-orange-100 text-orange-700",
    border: "border-orange-200",
    scoreColor: "text-orange-600",
    scoreBg: "bg-orange-50",
  },
  "Not Suitable": {
    badge: "bg-red-100 text-red-700",
    border: "border-red-200",
    scoreColor: "text-red-600",
    scoreBg: "bg-red-50",
  },
};

const getScoreColor = (score) => {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-orange-600";
  return "text-red-600";
};

const getScoreBg = (score) => {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 50) return "bg-orange-50 border-orange-200";
  return "bg-red-50 border-red-200";
};

const CandidateCard = ({ candidate, onSelect, onViewResume }) => {
  const styles = verdictStyles[candidate.verdict] || verdictStyles["Not Suitable"];
  const matchScore = candidate.matchScore || 0;
  const scoreColor = getScoreColor(matchScore);
  const scoreBg = getScoreBg(matchScore);

  // Extract derived fields
  const currentCompany = candidate.currentCompany || candidate.latestCompanyOne || "";
  const currentDesignation = candidate.currentDesignation || candidate.latestDesignationOne || candidate.roleApplied || "";
  const totalExpYears = candidate.totalExperienceYears || 0;
  const numberOfCompanies = candidate.numberOfCompanies || 0;
  const tenureMonths = candidate.tenureMonthsOne || 0;
  const scoreBreakdown = candidate.scoreBreakdown || {};

  return (
    <article
      className={`flex flex-col gap-2 rounded-lg border ${styles.border} bg-white p-3 hover:border-blue-300`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-slate-900">
            <FaUser className="text-blue-500 flex-shrink-0" aria-hidden />
            <h4 className="text-base font-semibold truncate">
              {candidate.candidateName || "Unnamed Candidate"}
            </h4>
            {candidate.linkedInUrl && (
              <a
                href={candidate.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-blue-600 hover:text-blue-700"
                onClick={(e) => e.stopPropagation()}
                title="LinkedIn Profile"
              >
                <FaLinkedin className="text-sm" />
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            {currentDesignation && (
              <span className="inline-flex items-center gap-1">
                <FaBriefcase />
                <span className="truncate max-w-[120px]">{currentDesignation}</span>
              </span>
            )}
            {currentCompany && (
              <span className="inline-flex items-center gap-1">
                <FaBuilding />
                <span className="truncate max-w-[100px]">{currentCompany}</span>
              </span>
            )}
            {candidate.candidateLocation && (
              <span className="inline-flex items-center gap-1">
                <FaMapMarkerAlt />
                <span className="truncate max-w-[80px]">{candidate.candidateLocation}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
            {candidate.verdict}
          </span>
          <div className={`flex items-center gap-1.5 rounded-lg border ${scoreBg} px-2.5 py-1`}>
            <FaChartLine className={`text-xs ${scoreColor}`} />
            <span className={`text-sm font-bold ${scoreColor}`}>
              {matchScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Experience Summary */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {totalExpYears > 0 && (
          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 rounded px-2 py-1">
            <FaCalendarAlt className="text-slate-400" />
            <span className="font-medium">{totalExpYears}Y</span>
            {numberOfCompanies > 0 && (
              <span className="text-slate-400">• {numberOfCompanies} Co</span>
            )}
          </div>
        )}
        {tenureMonths > 0 && (
          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 rounded px-2 py-1">
            <span className="font-medium">Tenure: {Math.round(tenureMonths / 12 * 10) / 10}Y</span>
          </div>
        )}
      </div>

      {/* Score Breakdown (Compact) */}
      {(scoreBreakdown.jdMatch || scoreBreakdown.experienceMatch || scoreBreakdown.locationMatch || scoreBreakdown.stabilityScore) && (
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {scoreBreakdown.jdMatch !== undefined && (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
              JD: {scoreBreakdown.jdMatch}
            </span>
          )}
          {scoreBreakdown.experienceMatch !== undefined && (
            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded font-medium">
              Exp: {scoreBreakdown.experienceMatch}
            </span>
          )}
          {scoreBreakdown.locationMatch !== undefined && (
            <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">
              Loc: {scoreBreakdown.locationMatch}
            </span>
          )}
          {scoreBreakdown.stabilityScore !== undefined && (
            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">
              Stab: {scoreBreakdown.stabilityScore}
            </span>
          )}
        </div>
      )}

      {candidate.companyLocation && candidate.candidateLocation && candidate.companyLocation !== "Not specified" && (
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
          <FaMapMarkerAlt className="text-slate-400" />
          <span className="font-medium">Location:</span>
          <span>{candidate.candidateLocation}</span>
          <span className="text-slate-400">→</span>
          <span>{candidate.companyLocation}</span>
        </div>
      )}
      
      <div className="space-y-2">
        {candidate.strengths?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Strengths
            </p>
            <p className="max-h-10 overflow-hidden text-ellipsis text-xs leading-relaxed text-slate-600">
              {candidate.strengths.slice(0, 2).join("; ")}
            </p>
          </div>
        )}
        {(candidate.gaps?.length > 0 || candidate.educationGaps?.length > 0 || candidate.experienceGaps?.length > 0) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Gaps
            </p>
            <p className="max-h-10 overflow-hidden text-ellipsis text-xs leading-relaxed text-slate-600">
              {[...(candidate.gaps || []), ...(candidate.educationGaps || []), ...(candidate.experienceGaps || [])].slice(0, 2).join("; ")}
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={() => onSelect(candidate)}
          className="flex-1 flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          <FaEnvelopeOpenText />
          View &amp; Send Email
        </button>
        {(candidate.databaseId || candidate.id) && onViewResume && (
          <button
            type="button"
            onClick={() => onViewResume(candidate)}
            className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            title="View Resume"
          >
            <FaFilePdf />
            Resume
          </button>
        )}
      </div>
    </article>
  );
};

export default CandidateCard;

