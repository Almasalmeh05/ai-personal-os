import { useMemo, useState } from 'react';
import { AuthPage } from '@/features/auth/AuthPage';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';

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
        <p>Secure workspace enabled with Firebase authentication.</p>
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

function WorkspaceApp() {
  const { user, loading, signOutUser } = useAuth();
  const [activeView, setActiveView] = useState<WorkspaceView>('dashboard');
  const activeItem = navItems.find((item) => item.id === activeView) ?? navItems[0]!;

  if (loading) {
    return <main className="auth-shell">Loading workspace...</main>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <h1>AI Personal OS</h1>
            <p>{user.email ?? 'Signed in user'}</p>
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
          <div className="workspace-actions">
            <div className="status-pill">Authenticated</div>
            <button type="button" className="secondary-button" onClick={() => void signOutUser()}>
              Sign out
            </button>
          </div>
        </header>

        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'notes' && (
          <PlaceholderView title="Notes" description="Notes module will be connected to Firebase in the next milestone." />
        )}
        {activeView === 'tasks' && (
          <PlaceholderView title="Tasks" description="Tasks module will be connected to Firebase in the next milestone." />
        )}
        {activeView === 'calendar' && (
          <PlaceholderView
            title="Calendar"
            description="Calendar module will be connected to Firebase in the next milestone."
          />
        )}
        {activeView === 'assistant' && (
          <PlaceholderView
            title="AI Assistant"
            description="Assistant memory and prompts will be connected to Firebase in the next milestone."
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceApp />
    </AuthProvider>
  );
}
