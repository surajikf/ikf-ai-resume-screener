const summaryConfig = [
  {
    key: "Recommended",
    title: "Recommended",
    description: "Ready for next-stage conversations.",
    accent: "from-emerald-300/50 to-emerald-500/10 text-emerald-700 border-emerald-200",
  },
  {
    key: "Partially Suitable",
    title: "Partially Suitable",
    description: "Potential fits or entry-level prospects.",
    accent: "from-amber-300/50 to-amber-500/10 text-amber-700 border-amber-200",
  },
  {
    key: "Not Suitable",
    title: "Not Suitable",
    description: "Profiles that should be archived for now.",
    accent: "from-rose-300/50 to-rose-500/10 text-rose-700 border-rose-200",
  },
];

const StatusSummary = ({ counts, lastEvaluated }) => {
  return (
    <div className="flex items-center gap-3">
      {summaryConfig.map((item) => (
        <div
          key={item.key}
          className={`flex items-center gap-2 rounded-lg border bg-gradient-to-br ${item.accent} px-4 py-2`}
        >
          <p className="text-lg font-bold">
            {counts[item.key] ?? 0}
          </p>
          <p className="text-xs font-medium text-slate-700">{item.title}</p>
        </div>
      ))}
    </div>
  );
};

export default StatusSummary;

