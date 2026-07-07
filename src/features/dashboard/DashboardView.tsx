import { useMemo } from 'react';

interface DashboardViewProps {
  email: string;
}

export function DashboardView(props: DashboardViewProps) {
  const { email } = props;
  const cards = useMemo(
    () => [
      { title: 'Focus Score', value: '91%', hint: 'Strong consistency this week' },
      { title: 'Deep Work', value: '12h', hint: 'Across the past 7 days' },
      { title: 'Completion Rate', value: '84%', hint: 'Tasks finished on time' },
      { title: 'AI Sessions', value: '19', hint: 'Ideas and plans generated' },
    ],
    []
  );

  return (
    <div className="module-grid">
      <section className="surface-card surface-card-wide">
        <h3>Welcome back</h3>
        <p>
          Signed in as <strong>{email}</strong>. Use the left navigation to manage notes, tasks, calendar, and AI workflows.
        </p>
      </section>
      {cards.map((card) => (
        <article key={card.title} className="surface-card">
          <p className="card-label">{card.title}</p>
          <h3 className="card-value">{card.value}</h3>
          <p className="card-hint">{card.hint}</p>
        </article>
      ))}
    </div>
  );
}
