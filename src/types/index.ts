export type UUID = string;

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
  retry?: () => Promise<void>;
}

export interface Note {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface TaskItem {
  id: string;
  ownerId: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
}

export interface CalendarEvent {
  id: string;
  ownerId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface AssistantMessage {
  id: string;
  ownerId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}
