'use client';

import { useCallback, useEffect, useMemo, useReducer } from 'react';
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
  const restoredTimer = useMemo(
    () => restorePersistedWorkoutTimer(eventId),
    [eventId],
  );

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
  const saveWorkoutData = useCallback(
    (data: WorkoutAutosaveData) => {
      if (!eventId) return;
      updateWorkout.mutate({
        id: eventId,
        data,
        date,
        type: 'workout',
      });
    },
    [date, eventId, updateWorkout],
  );

  useWorkoutSessionPersistence({ state, eventId });
  useWorkoutSessionAutosave({ state, eventId, date, saveWorkoutData });
  useWorkoutRestTimer(state.restTimer.active, dispatch);
  const elapsedSeconds = useWorkoutElapsedSeconds(state);

  const startWorkout = useCallback(
    () => dispatch({ type: 'START_WORKOUT' }),
    [],
  );

  const completeSet = useCallback(
    (exerciseIdx: number, setIdx: number) =>
      dispatch({
        type: 'COMPLETE_SET',
        exerciseIndex: exerciseIdx,
        setIndex: setIdx,
      }),
    [],
  );

  const undoSet = useCallback(
    (exerciseIdx: number, setIdx: number) =>
      dispatch({
        type: 'UNDO_SET',
        exerciseIndex: exerciseIdx,
        setIndex: setIdx,
      }),
    [],
  );

  const updateSetValue = useCallback(
    (
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
      }),
    [],
  );

  const goToNextExercise = useCallback(
    () => dispatch({ type: 'NEXT_EXERCISE' }),
    [],
  );

  const goToPrevExercise = useCallback(
    () => dispatch({ type: 'PREV_EXERCISE' }),
    [],
  );

  const goToExercise = useCallback(
    (index: number) => dispatch({ type: 'GO_TO_EXERCISE', index }),
    [],
  );

  const completeWorkout = useCallback(
    () => dispatch({ type: 'COMPLETE_WORKOUT' }),
    [],
  );

  const exitWorkout = useCallback(
    () => dispatch({ type: 'EXIT_WORKOUT' }),
    [],
  );

  const skipRest = useCallback(
    () => dispatch({ type: 'SKIP_REST' }),
    [],
  );

  const currentExercise = state.exercises[state.currentExerciseIndex] ?? null;

  const { totalSetsCompleted, totalSets } = useMemo(() => {
    let completed = 0;
    let total = 0;

    for (const exercise of state.exercises) {
      for (const set of exercise.sets) {
        total += 1;
        if (set.completed) completed += 1;
      }
    }

    return { totalSetsCompleted: completed, totalSets: total };
  }, [state.exercises]);

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
