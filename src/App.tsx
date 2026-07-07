import { useMemo, useState } from 'react';
import { AuthPage } from '@/features/auth/AuthPage';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { NotesView } from '@/features/notes/NotesView';
import { TasksView } from '@/features/tasks/TasksView';
import { CalendarView } from '@/features/calendar/CalendarView';
import { AssistantView } from '@/features/assistant/AssistantView';

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

function WorkspaceApp() {
  const { user, loading, signOutUser } = useAuth();
  const [activeView, setActiveView] = useState<WorkspaceView>('dashboard');
  const activeItem = useMemo(() => navItems.find((item) => item.id === activeView) ?? navItems[0]!, [activeView]);

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

        {activeView === 'dashboard' && <DashboardView email={user.email ?? 'No email available'} />}
        {activeView === 'notes' && <NotesView ownerId={user.uid} />}
        {activeView === 'tasks' && <TasksView ownerId={user.uid} />}
        {activeView === 'calendar' && <CalendarView ownerId={user.uid} />}
        {activeView === 'assistant' && <AssistantView ownerId={user.uid} />}
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
