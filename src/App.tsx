import { useMemo, useState } from 'react';

type WorkspaceView = 'dashboard' | 'notes' | 'tasks' | 'calendar' | 'assistant';

interface NavItem {
  id: WorkspaceView;
  title: string;
  subtitle: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', title: 'Dashboard', subtitle: 'Your focus today' },
  { id: 'notes', title: 'Notes', subtitle: 'Capture thoughts quickly' },
  { id: 'tasks', title: 'Tasks', subtitle: 'Track execution' },
  { id: 'calendar', title: 'Calendar', subtitle: 'Protect your time' },
  { id: 'assistant', title: 'AI Assistant', subtitle: 'Plan and brainstorm' },
];
const fallbackNavItem: NavItem = navItems[0]!;

function DashboardView() {
  const cards = useMemo(
    () => [
      { title: 'Focus Score', value: '88%', hint: '+4% from yesterday' },
      { title: 'Open Tasks', value: '14', hint: '5 due today' },
      { title: 'Notes Captured', value: '27', hint: '9 this week' },
      { title: 'Meetings', value: '3', hint: 'next starts 2:00 PM' },
    ],
    []
  );

  return (
    <section className="content-grid">
      {cards.map((card) => (
        <article key={card.title} className="surface-card">
          <p className="card-label">{card.title}</p>
          <h3 className="card-value">{card.value}</h3>
          <p className="card-hint">{card.hint}</p>
        </article>
      ))}
      <article className="surface-card surface-card-wide">
        <h3>Daily briefing</h3>
        <p>
          Welcome to AI Personal OS. This workspace unifies notes, tasks, calendar planning and AI workflows in a single
          streamlined command center.
        </p>
      </article>
    </section>
  );
}

function PlaceholderView(props: { title: string; description: string }) {
  const { title, description } = props;
  return (
    <section className="surface-card">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>('dashboard');
  const activeItem = navItems.find((item) => item.id === activeView) ?? fallbackNavItem;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <h1>AI Personal OS</h1>
            <p>Production workspace</p>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item${item.id === activeView ? ' nav-item-active' : ''}`}
              type="button"
              onClick={() => setActiveView(item.id)}
            >
              <span>{item.title}</span>
              <small>{item.subtitle}</small>
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <h2>{activeItem.title}</h2>
            <p>{activeItem.subtitle}</p>
          </div>
          <div className="status-pill">Live</div>
        </header>

        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'notes' && (
          <PlaceholderView
            title="Notes"
            description="Your notes workspace is ready for rich capture, search and organization."
          />
        )}
        {activeView === 'tasks' && (
          <PlaceholderView
            title="Tasks"
            description="Track priorities and execution with fast updates and clear accountability."
          />
        )}
        {activeView === 'calendar' && (
          <PlaceholderView
            title="Calendar"
            description="Plan deep work blocks and commitments with a clean and responsive schedule view."
          />
        )}
        {activeView === 'assistant' && (
          <PlaceholderView
            title="AI Assistant"
            description="Ask for summaries, execution plans and writing support from your embedded assistant."
          />
        )}
      </main>
    </div>
  );
}
