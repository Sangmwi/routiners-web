'use client';

import type { WorkoutExercise, WorkoutSet } from '@/lib/types/routine';
import type { PersistedTimer } from './persistence';
import type { WorkoutAction, WorkoutSessionState } from './types';

function updateExerciseSets(
  exercises: WorkoutExercise[],
  exerciseIndex: number,
  updater: (sets: WorkoutSet[]) => WorkoutSet[]
): WorkoutExercise[] {
  return exercises.map((exercise, index) =>
    index === exerciseIndex ? { ...exercise, sets: updater(exercise.sets) } : exercise
  );
}

export function createInitialWorkoutSessionState(
  exercises: WorkoutExercise[],
  restoredTimer: PersistedTimer | null,
): WorkoutSessionState {
  if (restoredTimer) {
    return {
      phase: 'overview',
      currentExerciseIndex: restoredTimer.currentExerciseIndex,
      exercises,
      restTimer: { active: false, remaining: 0, total: 0 },
      startedAt: restoredTimer.startedAt,
      completedAt: null,
      pausedAt: restoredTimer.pausedAt ?? Date.now(),
      pausedDuration: restoredTimer.pausedDuration,
    };
  }

  return {
    phase: 'overview',
    currentExerciseIndex: 0,
    exercises,
    restTimer: { active: false, remaining: 0, total: 0 },
    startedAt: null,
    completedAt: null,
    pausedAt: null,
    pausedDuration: 0,
  };
}

export function workoutSessionReducer(
  state: WorkoutSessionState,
  action: WorkoutAction
): WorkoutSessionState {
  switch (action.type) {
    case 'START_WORKOUT': {
      if (state.startedAt && state.pausedAt) {
        return {
          ...state,
          phase: 'active',
          pausedDuration: state.pausedDuration + (Date.now() - state.pausedAt),
          pausedAt: null,
        };
      }

      return {
        ...state,
        phase: 'active',
        currentExerciseIndex: 0,
        startedAt: Date.now(),
        pausedAt: null,
        pausedDuration: 0,
      };
    }

    case 'COMPLETE_SET': {
      const { exerciseIndex, setIndex } = action;
      const exercise = state.exercises[exerciseIndex];
      if (!exercise) return state;

      const set = exercise.sets[setIndex];
      if (!set || set.completed) return state;

      const newExercises = updateExerciseSets(state.exercises, exerciseIndex, (sets) =>
        sets.map((item, index) =>
          index === setIndex
            ? {
                ...item,
                completed: true,
                actualReps: item.actualReps ?? item.targetReps,
                actualWeight: item.actualWeight ?? item.targetWeight,
              }
            : item
        )
      );

      const restSeconds = set.restSeconds ?? exercise.restSeconds ?? 60;
      const allSetsCompleted = newExercises[exerciseIndex].sets.every((item) => item.completed);

      return {
        ...state,
        exercises: newExercises,
        restTimer: allSetsCompleted
          ? state.restTimer
          : { active: true, remaining: restSeconds, total: restSeconds },
      };
    }

    case 'UNDO_SET':
      return {
        ...state,
        exercises: updateExerciseSets(state.exercises, action.exerciseIndex, (sets) =>
          sets.map((item, index) => (index === action.setIndex ? { ...item, completed: false } : item))
        ),
        restTimer: { active: false, remaining: 0, total: 0 },
      };

    case 'UPDATE_SET_VALUE':
      return {
        ...state,
        exercises: updateExerciseSets(state.exercises, action.exerciseIndex, (sets) =>
          sets.map((item, index) =>
            index === action.setIndex ? { ...item, [action.field]: action.value } : item
          )
        ),
      };

    case 'START_REST':
      return {
        ...state,
        restTimer: { active: true, remaining: action.seconds, total: action.seconds },
      };

    case 'TICK_REST': {
      if (!state.restTimer.active) return state;
      const next = state.restTimer.remaining - 1;
      if (next <= 0) {
        return {
          ...state,
          restTimer: { active: false, remaining: 0, total: 0 },
        };
      }
      return {
        ...state,
        restTimer: { ...state.restTimer, remaining: next },
      };
    }

    case 'SKIP_REST':
      return {
        ...state,
        restTimer: { active: false, remaining: 0, total: 0 },
      };

    case 'NEXT_EXERCISE':
      return {
        ...state,
        currentExerciseIndex: Math.min(state.currentExerciseIndex + 1, state.exercises.length - 1),
        restTimer: { active: false, remaining: 0, total: 0 },
      };

    case 'PREV_EXERCISE':
      return {
        ...state,
        currentExerciseIndex: Math.max(state.currentExerciseIndex - 1, 0),
        restTimer: { active: false, remaining: 0, total: 0 },
      };

    case 'GO_TO_EXERCISE':
      if (action.index < 0 || action.index >= state.exercises.length) {
        return state;
      }
      return {
        ...state,
        currentExerciseIndex: action.index,
        restTimer: { active: false, remaining: 0, total: 0 },
      };

    case 'COMPLETE_WORKOUT':
      return {
        ...state,
        phase: 'complete',
        completedAt: Date.now(),
        restTimer: { active: false, remaining: 0, total: 0 },
      };

    case 'EXIT_WORKOUT':
      return {
        ...state,
        phase: 'overview',
        restTimer: { active: false, remaining: 0, total: 0 },
        pausedAt: Date.now(),
      };

    case 'SYNC_EXERCISES':
      if (state.phase !== 'overview') return state;
      return {
        ...state,
        exercises: action.exercises,
      };

    default:
      return state;
  }
}
