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
    <section className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow">
      <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            IKF Candidate Kanban
          </h2>
          <p className="text-sm text-slate-500">
            Each lane mirrors the HR verdict. Click a card to open the AI summary and tailored email.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 text-xs text-slate-500 md:items-end">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {evaluations.length} candidate{evaluations.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-amber-700">
            <FaLightbulb />
            Quick tip: drag &amp; drop is on the roadmap—meanwhile, use this board as a triage hub.
          </div>
        </div>
      </header>

      {!hasAnyCandidates ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-700">
            No evaluations yet
          </p>
          <p className="max-w-md text-sm text-slate-500">
            Upload a resume, provide a job description, and run the AI evaluation
            to see candidates populate this Jira-style board.
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
                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-semibold text-slate-700 ${column.accent}`}
              >
                <div className="flex items-center gap-2">
                  {column.icon}
                  {column.title}
                </div>
                <span className="rounded-md bg-white px-2 py-1 text-xs text-slate-600">
                  {column.items.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-4">
                {column.items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-400">
                    No candidates yet
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

