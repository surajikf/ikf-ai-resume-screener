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
    <section className="grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
      {summaryConfig.map((item) => (
        <article
          key={item.key}
          className={`flex flex-col gap-2 rounded-2xl border bg-gradient-to-br ${item.accent} px-5 py-5 shadow-sm`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            {item.title}
          </p>
          <p className="text-3xl font-semibold">
            {counts[item.key] ?? 0}
          </p>
          <p className="text-xs text-slate-600">{item.description}</p>
        </article>
      ))}
      <article className="md:col-span-3 flex items-start justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        <div>
          <p className="font-semibold text-slate-900">Evaluation activity</p>
          <p className="text-xs text-slate-500">
            {lastEvaluated
              ? `Latest summary generated at ${new Date(lastEvaluated).toLocaleString()}`
              : "Run your first evaluation to populate the kanban board."}
          </p>
        </div>
      </article>
    </section>
  );
};

export default StatusSummary;

