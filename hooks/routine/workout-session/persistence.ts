'use client';

const STORAGE_KEY = 'workout_timer';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface PersistedTimer {
  eventId: string;
  startedAt: number;
  pausedAt: number | null;
  pausedDuration: number;
  currentExerciseIndex: number;
}

export function persistWorkoutTimer(data: PersistedTimer) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors (e.g. quota)
  }
}

export function restorePersistedWorkoutTimer(eventId: string): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedTimer;
    if (Date.now() - parsed.startedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.eventId === eventId ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPersistedTimer() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}
