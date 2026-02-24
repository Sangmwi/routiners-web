'use client';

import { useEffect, useRef, useState, type Dispatch } from 'react';
import type { WorkoutExercise } from '@/lib/types/routine';
import type { WorkoutAction, WorkoutSessionState } from './types';
import {
  clearPersistedTimer,
  persistWorkoutTimer,
} from './persistence';

interface UseWorkoutSessionPersistenceOptions {
  state: WorkoutSessionState;
  eventId: string;
}

interface WorkoutAutosavePayload {
  exercises: WorkoutExercise[];
  elapsedSeconds?: number;
}

interface UseWorkoutSessionAutosaveOptions {
  state: WorkoutSessionState;
  eventId: string;
  date: string;
  saveWorkoutData: (payload: WorkoutAutosavePayload) => void;
}

function calculateElapsedSeconds(
  startedAt: number,
  pausedDuration: number,
  endedAt: number = Date.now(),
) {
  return Math.floor((endedAt - startedAt - pausedDuration) / 1000);
}

export function useWorkoutSessionPersistence({
  state,
  eventId,
}: UseWorkoutSessionPersistenceOptions) {
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!state.startedAt) return;

    if (state.phase === 'complete') {
      clearPersistedTimer();
      return;
    }

    persistWorkoutTimer({
      eventId,
      startedAt: state.startedAt,
      pausedAt: state.pausedAt,
      pausedDuration: state.pausedDuration,
      currentExerciseIndex: state.currentExerciseIndex,
    });
  }, [
    eventId,
    state.currentExerciseIndex,
    state.pausedAt,
    state.pausedDuration,
    state.phase,
    state.startedAt,
  ]);

  useEffect(() => {
    const saveOnLeave = () => {
      const current = stateRef.current;
      if (current.startedAt && current.phase === 'active') {
        persistWorkoutTimer({
          eventId,
          startedAt: current.startedAt,
          pausedAt: Date.now(),
          pausedDuration: current.pausedDuration,
          currentExerciseIndex: current.currentExerciseIndex,
        });
      }
    };

    window.addEventListener('beforeunload', saveOnLeave);
    return () => {
      window.removeEventListener('beforeunload', saveOnLeave);
      saveOnLeave();
    };
  }, [eventId]);
}

export function useWorkoutSessionAutosave({
  state,
  saveWorkoutData,
}: UseWorkoutSessionAutosaveOptions) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exercisesRef = useRef(state.exercises);
  const saveRef = useRef(saveWorkoutData);

  useEffect(() => {
    exercisesRef.current = state.exercises;
  }, [state.exercises]);

  useEffect(() => {
    saveRef.current = saveWorkoutData;
  }, [saveWorkoutData]);

  useEffect(() => {
    if (state.phase === 'overview') return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveRef.current({ exercises: exercisesRef.current });
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [state.exercises, state.phase]);

  useEffect(() => {
    if (state.phase !== 'active' || !state.startedAt) return;

    const interval = setInterval(() => {
      const elapsed = calculateElapsedSeconds(state.startedAt!, state.pausedDuration);
      saveRef.current({
        exercises: exercisesRef.current,
        elapsedSeconds: elapsed,
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [state.pausedDuration, state.phase, state.startedAt]);

  useEffect(() => {
    if (state.phase !== 'complete' || !state.startedAt || !state.completedAt) return;

    saveRef.current({
      exercises: exercisesRef.current,
      elapsedSeconds: calculateElapsedSeconds(
        state.startedAt,
        state.pausedDuration,
        state.completedAt,
      ),
    });
  }, [state.completedAt, state.pausedDuration, state.phase, state.startedAt]);
}

export function useWorkoutRestTimer(
  isRestTimerActive: boolean,
  dispatch: Dispatch<WorkoutAction>,
) {
  useEffect(() => {
    if (!isRestTimerActive) return;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_REST' });
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatch, isRestTimerActive]);
}

export function useWorkoutElapsedSeconds(state: WorkoutSessionState) {
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!state.startedAt || state.phase !== 'active') return;

    const updateElapsed = () => {
      setLiveElapsedSeconds(calculateElapsedSeconds(state.startedAt!, state.pausedDuration));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [state.pausedDuration, state.phase, state.startedAt]);

  if (state.phase === 'complete' && state.startedAt && state.completedAt) {
    return calculateElapsedSeconds(state.startedAt, state.pausedDuration, state.completedAt);
  }

  return liveElapsedSeconds;
}
