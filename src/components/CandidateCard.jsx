import { FaEnvelopeOpenText } from "react-icons/fa";

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
      className={`flex flex-col gap-3 rounded-lg border ${styles.border} bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-base font-semibold text-slate-900">
            {candidate.candidateName || "Unnamed Candidate"}
          </h4>
          <p className="text-sm text-slate-500">
            {candidate.roleApplied || candidate.jobTitle || "Role not specified"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
          {candidate.verdict}
        </span>
      </div>
      <div className="space-y-2">
        {candidate.strengths?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Strengths
            </p>
            <p className="max-h-12 overflow-hidden text-ellipsis text-sm text-slate-600">
              {candidate.strengths.slice(0, 2).join("; ")}
            </p>
          </div>
        )}
        {candidate.gaps?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Gaps
            </p>
            <p className="max-h-12 overflow-hidden text-ellipsis text-sm text-slate-600">
              {candidate.gaps.slice(0, 2).join("; ")}
            </p>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onSelect(candidate)}
        className="flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
      >
        <FaEnvelopeOpenText />
        View Full Evaluation
      </button>
    </article>
  );
};

export default CandidateCard;

