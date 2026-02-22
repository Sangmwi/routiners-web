'use client';

import { useEffect, useReducer } from 'react';
import type { WorkoutData } from '@/lib/types/routine';
import { useUpdateWorkoutData } from './mutations';
import {
  createInitialWorkoutSessionState,
  workoutSessionReducer,
} from './workout-session/reducer';
import {
  clearPersistedTimer,
  restorePersistedWorkoutTimer,
} from './workout-session/persistence';
import {
  useWorkoutElapsedSeconds,
  useWorkoutRestTimer,
  useWorkoutSessionAutosave,
  useWorkoutSessionPersistence,
} from './workout-session/useWorkoutSessionEffects';
import type {
  UseWorkoutSessionOptions,
  WorkoutSessionReturn,
} from './workout-session/types';

type WorkoutAutosaveData =
  Pick<WorkoutData, 'exercises'> &
  Partial<Pick<WorkoutData, 'elapsedSeconds'>>;

export { clearPersistedTimer };
export type {
  WorkoutAction,
  WorkoutSessionReturn,
  WorkoutSessionState,
} from './workout-session/types';

export function useWorkoutSession({
  exercises,
  eventId,
  date,
}: UseWorkoutSessionOptions): WorkoutSessionReturn {
  const restoredTimer = restorePersistedWorkoutTimer(eventId);

  const [state, dispatch] = useReducer(workoutSessionReducer, undefined, () =>
    createInitialWorkoutSessionState(exercises, restoredTimer),
  );

  useEffect(() => {
    if (
      exercises.length > 0 &&
      state.exercises.length === 0 &&
      state.phase === 'overview'
    ) {
      dispatch({ type: 'SYNC_EXERCISES', exercises });
    }
  }, [exercises, state.exercises.length, state.phase]);

  const updateWorkout = useUpdateWorkoutData();
  const saveWorkoutData = (data: WorkoutAutosaveData) => {
    if (!eventId) return;
    updateWorkout.mutate({
      id: eventId,
      data,
      date,
      type: 'workout',
    });
  };

  useWorkoutSessionPersistence({ state, eventId });
  useWorkoutSessionAutosave({ state, eventId, date, saveWorkoutData });
  useWorkoutRestTimer(state.restTimer.active, dispatch);
  const elapsedSeconds = useWorkoutElapsedSeconds(state);

  const startWorkout = () => dispatch({ type: 'START_WORKOUT' });

  const completeSet = (exerciseIdx: number, setIdx: number) =>
    dispatch({
      type: 'COMPLETE_SET',
      exerciseIndex: exerciseIdx,
      setIndex: setIdx,
    });

  const undoSet = (exerciseIdx: number, setIdx: number) =>
    dispatch({
      type: 'UNDO_SET',
      exerciseIndex: exerciseIdx,
      setIndex: setIdx,
    });

  const updateSetValue = (
    exerciseIdx: number,
    setIdx: number,
    field: 'actualReps' | 'actualWeight',
    value: number | undefined,
  ) =>
    dispatch({
      type: 'UPDATE_SET_VALUE',
      exerciseIndex: exerciseIdx,
      setIndex: setIdx,
      field,
      value,
    });

  const goToNextExercise = () => dispatch({ type: 'NEXT_EXERCISE' });

  const goToPrevExercise = () => dispatch({ type: 'PREV_EXERCISE' });

  const goToExercise = (index: number) => dispatch({ type: 'GO_TO_EXERCISE', index });

  const completeWorkout = () => dispatch({ type: 'COMPLETE_WORKOUT' });

  const exitWorkout = () => dispatch({ type: 'EXIT_WORKOUT' });

  const skipRest = () => dispatch({ type: 'SKIP_REST' });

  const currentExercise = state.exercises[state.currentExerciseIndex] ?? null;

  let totalSetsCompleted = 0;
  let totalSets = 0;
  for (const exercise of state.exercises) {
    for (const set of exercise.sets) {
      totalSets += 1;
      if (set.completed) totalSetsCompleted += 1;
    }
  }

  const isCurrentExerciseCompleted = currentExercise
    ? currentExercise.sets.every((set) => set.completed)
    : false;

  const isAllExercisesCompleted =
    totalSets > 0 && totalSetsCompleted === totalSets;

  const progress = totalSets > 0 ? totalSetsCompleted / totalSets : 0;

  const nextSetIndex = currentExercise
    ? currentExercise.sets.findIndex((set) => !set.completed)
    : -1;

  const hasActiveSession = !!(state.startedAt && state.phase === 'overview');

  return {
    state,
    dispatch,
    startWorkout,
    completeSet,
    undoSet,
    updateSetValue,
    goToNextExercise,
    goToPrevExercise,
    goToExercise,
    completeWorkout,
    exitWorkout,
    skipRest,
    currentExercise,
    totalSetsCompleted,
    totalSets,
    isCurrentExerciseCompleted,
    isAllExercisesCompleted,
    progress,
    nextSetIndex,
    elapsedSeconds,
    hasActiveSession,
  };
}
