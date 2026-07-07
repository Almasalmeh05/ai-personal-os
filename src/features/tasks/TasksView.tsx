import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TaskItem, TaskStatus } from '@/types';

interface TasksViewProps {
  ownerId: string;
}

export function TasksView(props: TasksViewProps) {
  const { ownerId } = props;
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskItem['priority']>('medium');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tasksQuery = query(collection(db, 'tasks'), where('ownerId', '==', ownerId), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const nextTasks = snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<TaskItem, 'id'>) }));
      setTasks(nextTasks);
    });
    return unsubscribe;
  }, [ownerId]);

  const createTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const now = Date.now();

    try {
      await addDoc(collection(db, 'tasks'), {
        ownerId,
        title,
        dueDate,
        priority,
        status: 'todo',
        createdAt: now,
        updatedAt: now,
      } satisfies Omit<TaskItem, 'id'>);
      setTitle('');
      setDueDate('');
      setPriority('medium');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create task.');
    }
  };

  const updateStatus = async (id: string, status: TaskStatus) => {
    setError(null);
    try {
      await updateDoc(doc(db, 'tasks', id), { status, updatedAt: Date.now() });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update task.');
    }
  };

  const deleteTask = async (id: string) => {
    setError(null);
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete task.');
    }
  };

  return (
    <div className="module-grid">
      <section className="surface-card">
        <h3>Create task</h3>
        <form className="module-form" onSubmit={createTask}>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" required />
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
          <select value={priority} onChange={(event) => setPriority(event.target.value as TaskItem['priority'])}>
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          {error && <p className="module-error">{error}</p>}
          <button type="submit">Add task</button>
        </form>
      </section>

      <section className="surface-card">
        <h3>Task board</h3>
        <div className="stack-list">
          {tasks.length === 0 && <p className="muted">No tasks yet.</p>}
          {tasks.map((task) => (
            <article key={task.id} className="list-card">
              <header>
                <h4>{task.title}</h4>
                <small>{task.dueDate}</small>
              </header>
              <p className="task-meta">
                Priority: <strong>{task.priority}</strong> · Status: <strong>{task.status}</strong>
              </p>
              <div className="module-actions">
                <select value={task.status} onChange={(event) => void updateStatus(task.id, event.target.value as TaskStatus)}>
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <button type="button" className="danger-button" onClick={() => void deleteTask(task.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
