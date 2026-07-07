/**
 * Retention-focused store for tracking engagement metrics.
 * Every feature is designed to maximize daily/weekly active users with 7+ day streaks.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UUID } from '@/types';

export interface StreakData {
  userId: UUID;
  currentStreak: number; // consecutive days
  longestStreak: number;
  lastCompletionDate: number;
  streakStartDate: number;
  completionsThisWeek: number;
  completionsThisMonth: number;
  weeklyGoal: number; // default 5 completions/week
  weeklyProgress: number; // 0-100%
  missedDays: number;
  gracePeriodsUsed: number; // how many times user used weekend grace
}

export interface EngagementMetric {
  date: number;
  tasksCompleted: number;
  timeSpent: number; // minutes
  aiRequestsUsed: number;
  notificationsOpened: number;
  sessionCount: number;
  avgSessionDuration: number; // minutes
}

export interface PredictedChurn {
  riskScore: number; // 0-1, 1 = high churn risk
  daysWithoutActivity: number;
  reason: 'streak_broken' | 'low_engagement' | 'new_user' | 'active';
  interventionNeeded: boolean;
  suggestedIntervention: string; // "Remind about streak", "Show wins", etc
}

interface RetentionStoreState {
  streak: StreakData | null;
  metrics: EngagementMetric[];
  churnPrediction: PredictedChurn | null;
  lastEngagedAt: number | null;
  hasOpenedAppToday: boolean;
  consecutiveAppOpens: number;
  isInCriticalWindow: boolean; // last 2 hours before losing streak

  // Actions
  recordCompletion(): Promise<void>;
  recordEngagement(engagement: Partial<EngagementMetric>): void;
  updateChurnPrediction(): void;
  checkStreakStatus(): void;
  useGracePeriod(): Promise<void>;
  getStreakNotification(): string | null;
  calculateWeeklyProgress(): number;
  trackAppOpen(): void;
  predictNextEngagementTime(): number | null;
}

/**
 * Calculate if user is in critical window (likely to lose streak).
 * Returns true if it's within 2 hours of midnight and streak is active.
 */
function isInCriticalWindow(streak: StreakData | null): boolean {
  if (!streak || streak.currentStreak === 0) return false;

  const now = new Date();
  const hoursUntilMidnight =
    (24 - now.getHours() - (now.getMinutes() / 60)) % 24;

  return hoursUntilMidnight <= 2;
}

/**
 * Calculate churn risk based on engagement patterns.
 */
function calculateChurnRisk(
  streak: StreakData | null,
  metrics: EngagementMetric[],
  lastEngagedAt: number | null
): PredictedChurn {
  const now = Date.now();
  const daysWithoutActivity = lastEngagedAt
    ? Math.floor((now - lastEngagedAt) / (1000 * 60 * 60 * 24))
    : 0;

  // New user (just signed up)
  if (metrics.length === 0) {
    return {
      riskScore: 0.7, // High risk: new users often churn
      daysWithoutActivity: 0,
      reason: 'new_user',
      interventionNeeded: true,
      suggestedIntervention:
        'Show quick wins. Auto-create 3 sample tasks. Celebrate first completion.',
    };
  }

  // User broken streak
  if (streak && streak.currentStreak === 0 && streak.missedDays > 0) {
    const riskScore = Math.min(0.9, 0.5 + daysWithoutActivity * 0.1);
    return {
      riskScore,
      daysWithoutActivity,
      reason: 'streak_broken',
      interventionNeeded: riskScore > 0.6,
      suggestedIntervention:
        daysWithoutActivity === 1
          ? 'Show "Restart your streak" CTA with easy task'
          : 'Send email: "We miss you! Your teammates completed X tasks this week"',
    };
  }

  // Low engagement
  if (metrics.length > 0) {
    const recentMetrics = metrics.slice(-7); // Last 7 days
    const avgCompletions = recentMetrics.reduce(
      (sum, m) => sum + m.tasksCompleted,
      0
    ) / recentMetrics.length;

    if (avgCompletions < 1) {
      return {
        riskScore: 0.7,
        daysWithoutActivity,
        reason: 'low_engagement',
        interventionNeeded: true,
        suggestedIntervention:
          'Show streaks of other team members. Add team leaderboard to app.',
      };
    }
  }

  // Active user
  return {
    riskScore: 0.1,
    daysWithoutActivity,
    reason: 'active',
    interventionNeeded: false,
    suggestedIntervention: 'Keep showing wins and notifications.',
  };
}

export const useRetentionStore = create<RetentionStoreState>()((
  set,
  get
) => ({
  streak: null,
  metrics: [],
  churnPrediction: null,
  lastEngagedAt: null,
  hasOpenedAppToday: false,
  consecutiveAppOpens: 0,
  isInCriticalWindow: false,

  recordCompletion: async () => {
    const { streak } = get();
    if (!streak) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // Check if completion already recorded today
    const lastCompletionToday =
      streak.lastCompletionDate &&
      Math.floor(streak.lastCompletionDate / (1000 * 60 * 60 * 24)) ===
        Math.floor(todayTimestamp / (1000 * 60 * 60 * 24));

    if (lastCompletionToday) {
      return; // Already completed today
    }

    // Calculate new streak
    let newStreak = streak.currentStreak + 1;
    const lastCompletionDaysAgo = Math.floor(
      (todayTimestamp - streak.lastCompletionDate) / (1000 * 60 * 60 * 24)
    );

    // Streak continues if completed yesterday or today
    if (lastCompletionDaysAgo > 1) {
      newStreak = 1; // Streak broken, restart
    }

    const newLongestStreak = Math.max(newStreak, streak.longestStreak);

    set((state) => ({
      streak: {
        ...state.streak!,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastCompletionDate: todayTimestamp,
        completionsThisWeek: state.streak!.completionsThisWeek + 1,
        completionsThisMonth: state.streak!.completionsThisMonth + 1,
      },
      lastEngagedAt: todayTimestamp,
      hasOpenedAppToday: true,
      isInCriticalWindow: false,
    }));

    // Update churn prediction
    get().updateChurnPrediction();
  },

  recordEngagement: (engagement) => {
    const now = Date.now();
    set((state) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find today's metric or create new
      const todayMetrics = state.metrics.find(
        (m) => m.date === today.getTime()
      );

      const updated = todayMetrics
        ? {
            ...todayMetrics,
            ...engagement,
            date: today.getTime(),
          }
        : {
            date: today.getTime(),
            tasksCompleted: engagement.tasksCompleted ?? 0,
            timeSpent: engagement.timeSpent ?? 0,
            aiRequestsUsed: engagement.aiRequestsUsed ?? 0,
            notificationsOpened: engagement.notificationsOpened ?? 0,
            sessionCount: engagement.sessionCount ?? 1,
            avgSessionDuration: engagement.avgSessionDuration ?? 0,
          };

      const newMetrics = state.metrics.filter((m) => m.date !== today.getTime());
      newMetrics.push(updated);

      return {
        metrics: newMetrics.slice(-90), // Keep last 90 days
        lastEngagedAt: now,
      };
    });
  },

  updateChurnPrediction: () => {
    const { streak, metrics, lastEngagedAt } = get();
    const prediction = calculateChurnRisk(streak, metrics, lastEngagedAt);
    set({ churnPrediction: prediction });
  },

  checkStreakStatus: () => {
    const { streak } = get();
    if (!streak) return;

    const now = new Date();
    const today = now.getTime();
    const yesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    ).getTime();

    // Check if streak should be broken
    if (streak.lastCompletionDate < yesterday) {
      set((state) => ({
        streak: {
          ...state.streak!,
          currentStreak: 0,
          missedDays: state.streak!.missedDays + 1,
        },
      }));
    }

    const inCriticalWindow = isInCriticalWindow(streak);
    set({ isInCriticalWindow: inCriticalWindow });
  },

  useGracePeriod: async () => {
    const { streak } = get();
    if (!streak || streak.gracePeriodsUsed >= 4) {
      throw new Error('Grace period not available');
    }

    set((state) => ({
      streak: {
        ...state.streak!,
        currentStreak: state.streak!.currentStreak + 1, // Add a day
        gracePeriodsUsed: state.streak!.gracePeriodsUsed + 1,
      },
    }));
  },

  getStreakNotification: () => {
    const { streak, isInCriticalWindow, churnPrediction } = get();

    if (!streak) return null;

    // In critical window (about to lose streak)
    if (isInCriticalWindow && streak.currentStreak > 0) {
      return `🔥 Streak at risk! You have 2 hours to complete a task and keep your ${streak.currentStreak}-day streak alive.`;
    }

    // Churn risk - encourage engagement
    if (
      churnPrediction?.interventionNeeded &&
      churnPrediction.reason === 'streak_broken'
    ) {
      return `👋 We miss you! Restart your streak with one task today.`;
    }

    // Celebration for milestones
    if (
      streak.currentStreak > 0 &&
      streak.currentStreak % 7 === 0
    ) {
      return `🎉 Amazing! You've been crushing it for ${streak.currentStreak} days straight!`;
    }

    return null;
  },

  calculateWeeklyProgress: () => {
    const { streak } = get();
    if (!streak) return 0;
    return Math.min(
      100,
      Math.round((streak.completionsThisWeek / streak.weeklyGoal) * 100)
    );
  },

  trackAppOpen: () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const today = now.getTime();

    set((state) => {
      const lastOpenDate = state.lastEngagedAt
        ? new Date(state.lastEngagedAt)
        : null;
      lastOpenDate?.setHours(0, 0, 0, 0);

      const openedToday =
        lastOpenDate && lastOpenDate.getTime() === today
          ? state.hasOpenedAppToday
          : false;

      return {
        hasOpenedAppToday: true,
        consecutiveAppOpens: openedToday
          ? state.consecutiveAppOpens + 1
          : 1,
        lastEngagedAt: Date.now(),
      };
    });
  },

  predictNextEngagementTime: () => {
    const { metrics } = get();
    if (metrics.length === 0) return null;

    // Find most active hour from last 14 days
    const recentMetrics = metrics.slice(-14);
    const hourlyActivity = new Map<number, number>();

    recentMetrics.forEach((m) => {
      const hour = new Date(m.date).getHours();
      hourlyActivity.set(hour, (hourlyActivity.get(hour) ?? 0) + m.taskCompleted);
    });

    // Find peak hour
    let peakHour = 9; // default morning
    let maxActivity = 0;

    hourlyActivity.forEach((count, hour) => {
      if (count > maxActivity) {
        maxActivity = count;
        peakHour = hour;
      }
    });

    // Return next occurrence of peak hour
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(peakHour, 0, 0, 0);

    return tomorrow.getTime();
  },
}));
