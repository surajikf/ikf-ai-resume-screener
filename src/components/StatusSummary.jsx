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
    <section className="grid gap-3 md:grid-cols-3">
      {summaryConfig.map((item) => (
        <article
          key={item.key}
          className={`flex items-center justify-between rounded-lg border bg-gradient-to-br ${item.accent} px-5 py-4`}
        >
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">{item.title}</p>
            <p className="text-2xl font-bold">
              {counts[item.key] ?? 0}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
};

export default StatusSummary;

