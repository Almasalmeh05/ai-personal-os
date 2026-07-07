import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Note } from '@/types';

interface NotesViewProps {
  ownerId: string;
}

export function NotesView(props: NotesViewProps) {
  const { ownerId } = props;
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const notesQuery = query(collection(db, 'notes'), where('ownerId', '==', ownerId), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
      const nextNotes = snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<Note, 'id'>) }));
      setNotes(nextNotes);
    });
    return unsubscribe;
  }, [ownerId]);

  const submitLabel = useMemo(() => (editingId ? 'Update note' : 'Save note'), [editingId]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const now = Date.now();

    try {
      if (editingId) {
        await updateDoc(doc(db, 'notes', editingId), { title, content, updatedAt: now });
      } else {
        await addDoc(collection(db, 'notes'), {
          ownerId,
          title,
          content,
          createdAt: now,
          updatedAt: now,
        } satisfies Omit<Note, 'id'>);
      }
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save note.');
    }
  };

  const onEdit = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const onDelete = async (id: string) => {
    setError(null);
    try {
      await deleteDoc(doc(db, 'notes', id));
      if (editingId === id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete note.');
    }
  };

  return (
    <div className="module-grid">
      <section className="surface-card">
        <h3>Write note</h3>
        <form className="module-form" onSubmit={onSubmit}>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" required />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={8}
            placeholder="Capture your thinking..."
            required
          />
          {error && <p className="module-error">{error}</p>}
          <div className="module-actions">
            <button type="submit">{submitLabel}</button>
            {editingId && (
              <button type="button" className="secondary-button" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="surface-card">
        <h3>Recent notes</h3>
        <div className="stack-list">
          {notes.length === 0 && <p className="muted">No notes yet.</p>}
          {notes.map((note) => (
            <article key={note.id} className="list-card">
              <header>
                <h4>{note.title}</h4>
                <small>{new Date(note.updatedAt).toLocaleString()}</small>
              </header>
              <p>{note.content}</p>
              <div className="module-actions">
                <button type="button" className="secondary-button" onClick={() => onEdit(note)}>
                  Edit
                </button>
                <button type="button" className="danger-button" onClick={() => void onDelete(note.id)}>
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
