import {
  FaEnvelopeOpenText,
  FaUser,
  FaMapMarkerAlt,
  FaBriefcase,
} from "react-icons/fa";

const verdictStyles = {
  Recommended: {
    badge: "bg-green-100 text-green-700",
    border: "border-green-200",
  },
  "Partially Suitable": {
    badge: "bg-orange-100 text-orange-700",
    border: "border-orange-200",
  },
  "Not Suitable": {
    badge: "bg-red-100 text-red-700",
    border: "border-red-200",
  },
};

const CandidateCard = ({ candidate, onSelect }) => {
  const styles = verdictStyles[candidate.verdict] || verdictStyles["Not Suitable"];

  return (
    <article
      className={`flex flex-col gap-3 rounded-xl border ${styles.border} bg-white p-5 shadow transition hover:-translate-y-1 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-900">
            <FaUser className="text-blue-500" aria-hidden />
            <h4 className="text-base font-semibold">
              {candidate.candidateName || "Unnamed Candidate"}
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <FaBriefcase />
              {candidate.roleApplied || candidate.jobTitle || "Role not specified"}
            </span>
            {candidate.experience && (
              <span className="inline-flex items-center gap-1">
                <FaMapMarkerAlt />
                {candidate.experience}
              </span>
            )}
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
          {candidate.verdict}
        </span>
      </div>
      <div className="space-y-3">
        {candidate.strengths?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Strengths
            </p>
            <p className="max-h-12 overflow-hidden text-ellipsis text-sm leading-relaxed text-slate-600">
              {candidate.strengths.slice(0, 2).join("; ")}
            </p>
          </div>
        )}
        {candidate.gaps?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Watch-outs
            </p>
            <p className="max-h-12 overflow-hidden text-ellipsis text-sm leading-relaxed text-slate-600">
              {candidate.gaps.slice(0, 2).join("; ")}
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

