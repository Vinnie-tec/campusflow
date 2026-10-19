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
    <section aria-label="Project statistics">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label}>
            <h2>{stat.label}</h2>
            <p>{stat.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}