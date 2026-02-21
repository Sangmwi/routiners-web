'use client';

import type { Dispatch } from 'react';
import type { WorkoutExercise } from '@/lib/types/routine';

export interface WorkoutSessionState {
  phase: 'overview' | 'active' | 'complete';
  currentExerciseIndex: number;
  exercises: WorkoutExercise[];
  restTimer: {
    active: boolean;
    remaining: number;
    total: number;
  };
  startedAt: number | null;
  completedAt: number | null;
  pausedAt: number | null;
  pausedDuration: number;
}

export type WorkoutAction =
  | { type: 'START_WORKOUT' }
  | { type: 'COMPLETE_SET'; exerciseIndex: number; setIndex: number }
  | { type: 'UNDO_SET'; exerciseIndex: number; setIndex: number }
  | {
      type: 'UPDATE_SET_VALUE';
      exerciseIndex: number;
      setIndex: number;
      field: 'actualReps' | 'actualWeight';
      value: number | undefined;
    }
  | { type: 'START_REST'; seconds: number }
  | { type: 'TICK_REST' }
  | { type: 'SKIP_REST' }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'PREV_EXERCISE' }
  | { type: 'GO_TO_EXERCISE'; index: number }
  | { type: 'COMPLETE_WORKOUT' }
  | { type: 'EXIT_WORKOUT' }
  | { type: 'SYNC_EXERCISES'; exercises: WorkoutExercise[] };

export interface UseWorkoutSessionOptions {
  exercises: WorkoutExercise[];
  eventId: string;
  date: string;
}

export interface WorkoutSessionReturn {
  state: WorkoutSessionState;
  dispatch: Dispatch<WorkoutAction>;
  startWorkout: () => void;
  completeSet: (exerciseIdx: number, setIdx: number) => void;
  undoSet: (exerciseIdx: number, setIdx: number) => void;
  updateSetValue: (
    exerciseIdx: number,
    setIdx: number,
    field: 'actualReps' | 'actualWeight',
    value: number | undefined
  ) => void;
  goToNextExercise: () => void;
  goToPrevExercise: () => void;
  goToExercise: (index: number) => void;
  completeWorkout: () => void;
  exitWorkout: () => void;
  skipRest: () => void;
  currentExercise: WorkoutExercise | null;
  totalSetsCompleted: number;
  totalSets: number;
  isCurrentExerciseCompleted: boolean;
  isAllExercisesCompleted: boolean;
  progress: number;
  nextSetIndex: number;
  elapsedSeconds: number;
  hasActiveSession: boolean;
}
