import CandidateCard from "@/components/CandidateCard";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaLightbulb,
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

const JiraBoard = ({ evaluations, onSelectCandidate }) => {
  const grouped = columnConfig.map((column) => ({
    ...column,
    items: evaluations.filter((item) => item.verdict === column.key),
  }));

  const hasAnyCandidates = evaluations.length > 0;

  return (
    <section className="flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Candidates
        </h2>
        <span className="text-xs text-slate-500">
          {evaluations.length} total
        </span>
      </header>

      {!hasAnyCandidates ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="text-sm text-slate-500">
            No candidates yet. Upload resumes and run evaluation to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 overflow-x-auto px-6 py-6 lg:grid-cols-3">
          {grouped.map((column) => (
            <div
              key={column.key}
              className="flex min-h-[420px] flex-col gap-4 rounded-xl bg-slate-50 p-4"
            >
              <div
                className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-semibold text-slate-700 ${column.accent}`}
              >
                <div className="flex items-center gap-2">
                  {column.icon}
                  <span>{column.title}</span>
                </div>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {column.items.length}
                </span>
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
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default JiraBoard;

