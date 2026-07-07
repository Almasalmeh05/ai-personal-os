import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AssistantMessage } from '@/types';

interface AssistantViewProps {
  ownerId: string;
}

function generateAssistantReply(prompt: string): string {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('plan')) {
    return 'Suggested plan: define goals, break work into milestones, then schedule daily deep-work blocks.';
  }
  if (normalized.includes('task')) {
    return 'Task advice: pick one high-impact task, estimate effort, and block a focused 45-minute sprint.';
  }
  if (normalized.includes('meeting')) {
    return 'Meeting prep: write desired outcomes, key decisions, and one fallback path before the meeting starts.';
  }
  return 'I can help with planning, writing, task prioritization, and productivity systems. Ask me for a specific next step.';
}

export function AssistantView(props: AssistantViewProps) {
  const { ownerId } = props;
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'assistantMessages'),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const nextMessages = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<AssistantMessage, 'id'>),
      }));
      setMessages(nextMessages);
    });
    return unsubscribe;
  }, [ownerId]);

  const assistantHint = useMemo(
    () => 'Examples: "Plan my week", "Prioritize today\'s tasks", "Draft a project update".',
    []
  );

  const submitPrompt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError('Please enter a message.');
      return;
    }
    const now = Date.now();

    try {
      await addDoc(collection(db, 'assistantMessages'), {
        ownerId,
        role: 'user',
        content: trimmed,
        createdAt: now,
      } satisfies Omit<AssistantMessage, 'id'>);

      await addDoc(collection(db, 'assistantMessages'), {
        ownerId,
        role: 'assistant',
        content: generateAssistantReply(trimmed),
        createdAt: now + 1,
      } satisfies Omit<AssistantMessage, 'id'>);

      setPrompt('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not send message.');
    }
  };

  return (
    <div className="module-grid">
      <section className="surface-card">
        <h3>Ask assistant</h3>
        <p className="muted">{assistantHint}</p>
        <form className="module-form" onSubmit={submitPrompt}>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={5}
            placeholder="What do you want help with?"
            required
          />
          {error && <p className="module-error">{error}</p>}
          <button type="submit">Send</button>
        </form>
      </section>

      <section className="surface-card">
        <h3>Conversation</h3>
        <div className="stack-list chat-list">
          {messages.length === 0 && <p className="muted">No messages yet.</p>}
          {messages.map((message) => (
            <article
              key={message.id}
              className={`list-card ${message.role === 'assistant' ? 'assistant-message' : 'user-message'}`}
            >
              <header>
                <h4>{message.role === 'assistant' ? 'AI Assistant' : 'You'}</h4>
                <small>{new Date(message.createdAt).toLocaleTimeString()}</small>
              </header>
              <p>{message.content}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
