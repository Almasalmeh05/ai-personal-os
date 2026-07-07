import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CalendarEvent } from '@/types';

interface CalendarViewProps {
  ownerId: string;
}

export function CalendarView(props: CalendarViewProps) {
  const { ownerId } = props;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventsQuery = query(collection(db, 'events'), where('ownerId', '==', ownerId), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const nextEvents = snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<CalendarEvent, 'id'>) }));
      setEvents(nextEvents);
    });
    return unsubscribe;
  }, [ownerId]);

  const createEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const now = Date.now();
    try {
      await addDoc(collection(db, 'events'), {
        ownerId,
        title,
        date,
        startTime,
        endTime,
        notes,
        createdAt: now,
        updatedAt: now,
      } satisfies Omit<CalendarEvent, 'id'>);
      setTitle('');
      setDate('');
      setStartTime('09:00');
      setEndTime('10:00');
      setNotes('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create event.');
    }
  };

  const removeEvent = async (id: string) => {
    setError(null);
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not remove event.');
    }
  };

  return (
    <div className="module-grid">
      <section className="surface-card">
        <h3>Add event</h3>
        <form className="module-form" onSubmit={createEvent}>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Event title" required />
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          <div className="inline-fields">
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
          </div>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Notes" />
          {error && <p className="module-error">{error}</p>}
          <button type="submit">Save event</button>
        </form>
      </section>

      <section className="surface-card">
        <h3>Upcoming schedule</h3>
        <div className="stack-list">
          {events.length === 0 && <p className="muted">No events scheduled.</p>}
          {events.map((event) => (
            <article key={event.id} className="list-card">
              <header>
                <h4>{event.title}</h4>
                <small>
                  {event.date} · {event.startTime}-{event.endTime}
                </small>
              </header>
              {event.notes && <p>{event.notes}</p>}
              <div className="module-actions">
                <button type="button" className="danger-button" onClick={() => void removeEvent(event.id)}>
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
