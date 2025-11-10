import CandidateCard from "@/components/CandidateCard";
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle } from "react-icons/fa";

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
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            IKF Candidate Kanban
          </h2>
          <p className="text-sm text-slate-500">
            Drag-and-drop coming soon. Click a card to view detailed evaluation
            and email draft.
          </p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {evaluations.length} candidates
        </span>
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
              className="flex min-h-[400px] flex-col gap-4 rounded-xl bg-slate-50 p-4"
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

