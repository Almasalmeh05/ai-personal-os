export type UUID = string;

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
  retry?: () => Promise<void>;
}
