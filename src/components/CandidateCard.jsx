import {
  FaEnvelopeOpenText,
  FaUser,
  FaMapMarkerAlt,
  FaBriefcase,
  FaChartLine,
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

const CandidateCard = ({ candidate, onSelect }) => {
  const styles = verdictStyles[candidate.verdict] || verdictStyles["Not Suitable"];
  const matchScore = candidate.matchScore || 0;
  const scoreColor = getScoreColor(matchScore);
  const scoreBg = getScoreBg(matchScore);

  return (
    <article
      className={`flex flex-col gap-3 rounded-xl border ${styles.border} bg-white p-5 shadow transition hover:-translate-y-1 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2 text-slate-900">
            <FaUser className="text-blue-500" aria-hidden />
            <h4 className="text-base font-semibold">
              {candidate.candidateName || "Unnamed Candidate"}
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
            <span className="inline-flex items-center gap-1">
              <FaBriefcase />
              {candidate.roleApplied || candidate.jobTitle || "Role not specified"}
            </span>
            {candidate.candidateLocation && (
              <span className="inline-flex items-center gap-1">
                <FaMapMarkerAlt />
                {candidate.candidateLocation}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
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
      {candidate.companyLocation && candidate.candidateLocation && (
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
          <FaMapMarkerAlt className="text-slate-400" />
          <span className="font-medium">Location:</span>
          <span>{candidate.candidateLocation}</span>
          {candidate.companyLocation && candidate.companyLocation !== "Not specified" && (
            <>
              <span className="text-slate-400">→</span>
              <span>{candidate.companyLocation}</span>
            </>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        {candidate.strengths?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Strengths
            </p>
            <p className="max-h-12 overflow-hidden text-ellipsis text-sm leading-relaxed text-slate-600">
              {candidate.strengths.slice(0, 2).join("; ")}
            </p>
          </div>
        )}
        {(candidate.gaps?.length > 0 || candidate.educationGaps?.length > 0 || candidate.experienceGaps?.length > 0) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Gaps
            </p>
            <p className="max-h-12 overflow-hidden text-ellipsis text-sm leading-relaxed text-slate-600">
              {[...(candidate.gaps || []), ...(candidate.educationGaps || []), ...(candidate.experienceGaps || [])].slice(0, 2).join("; ")}
            </p>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onSelect(candidate)}
        className="mt-1 flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
      >
        <FaEnvelopeOpenText />
        View Details
      </button>
    </article>
  );
};

export default CandidateCard;

