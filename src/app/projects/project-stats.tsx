type ProjectStatsProps = {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
};

export default function ProjectStats({
  total,
  planned,
  inProgress,
  completed,
}: ProjectStatsProps) {
  const stats = [
    { label: "Total projects", value: total },
    { label: "Planned", value: planned },
    { label: "In progress", value: inProgress },
    { label: "Completed", value: completed },
  ];

  return (
    <section
      aria-label="Project statistics"
      className="mx-auto max-w-5xl pb-12 sm:pb-16"
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <h2 className="text-sm font-medium text-slate-500">
              {stat.label}
            </h2>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              {stat.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}