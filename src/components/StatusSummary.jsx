const summaryConfig = [
  {
    key: "Recommended",
    title: "Recommended",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    key: "Partially Suitable",
    title: "Partially Suitable",
    accent: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    key: "Not Suitable",
    title: "Not Suitable",
    accent: "bg-rose-50 text-rose-700 border-rose-200",
  },
];

const StatusSummary = ({ counts, lastEvaluated }) => {
  return (
    <div className="flex items-center gap-2">
      {summaryConfig.map((item) => (
        <div
          key={item.key}
          className={`flex items-center gap-2 rounded-lg border ${item.accent} px-3 py-1.5`}
        >
          <p className="text-base font-bold">
            {counts[item.key] ?? 0}
          </p>
          <p className="text-xs font-medium">{item.title}</p>
        </div>
      ))}
    </div>
  );
};

export default StatusSummary;

