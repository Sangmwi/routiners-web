'use client';

import { useReducer, useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useUpdateWorkoutData } from './mutations';
import type { WorkoutExercise, WorkoutSet } from '@/lib/types/routine';

// ============================================================================
// localStorage Persistence (24시간 만료)
// ============================================================================

const STORAGE_KEY = 'workout_timer';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24시간

interface PersistedTimer {
  eventId: string;
  startedAt: number;
  pausedAt: number | null;
  pausedDuration: number;
  currentExerciseIndex: number;
}

function persistTimer(data: PersistedTimer) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota 초과 등 무시 */ }
}

function restoreTimer(eventId: string): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: PersistedTimer = JSON.parse(raw);
    // 24시간 만료 체크
    if (Date.now() - data.startedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data.eventId === eventId ? data : null;
  } catch {
    return null;
  }
}

export function clearPersistedTimer() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

// ============================================================================
// Types
// ============================================================================

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
  /** 일시정지 시점 (EXIT_WORKOUT 시 기록) */
  pausedAt: number | null;
  /** 누적 일시정지 시간 (ms) */
  pausedDuration: number;
}

type WorkoutAction =
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

interface UseWorkoutSessionOptions {
  exercises: WorkoutExercise[];
  eventId: string;
  date: string;
}

export interface WorkoutSessionReturn {
  state: WorkoutSessionState;
  dispatch: React.Dispatch<WorkoutAction>;
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
  /** 현재 운동에서 다음에 완료해야 할 세트 인덱스 (-1이면 모두 완료) */
  nextSetIndex: number;
  /** 총 운동 경과 시간 (초) - 스톱워치 */
  elapsedSeconds: number;
  /** localStorage에 저장된 진행 중 세션이 있는지 */
  hasActiveSession: boolean;
}

// ============================================================================
// Reducer
// ============================================================================

function updateExerciseSets(
  exercises: WorkoutExercise[],
  exerciseIndex: number,
  updater: (sets: WorkoutSet[]) => WorkoutSet[]
): WorkoutExercise[] {
  return exercises.map((ex, i) =>
    i === exerciseIndex ? { ...ex, sets: updater(ex.sets) } : ex
  );
}

function workoutReducer(
  state: WorkoutSessionState,
  action: WorkoutAction
): WorkoutSessionState {
  switch (action.type) {
    case 'START_WORKOUT': {
      // 재개: startedAt이 이미 있으면 일시정지 시간 누적
      if (state.startedAt && state.pausedAt) {
        return {
          ...state,
          phase: 'active',
          pausedDuration: state.pausedDuration + (Date.now() - state.pausedAt),
          pausedAt: null,
        };
      }
      // 최초 시작
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

      const newExercises = updateExerciseSets(
        state.exercises,
        exerciseIndex,
        (sets) =>
          sets.map((s, i) =>
            i === setIndex
              ? {
                  ...s,
                  completed: true,
                  actualReps: s.actualReps ?? s.targetReps,
                  actualWeight: s.actualWeight ?? s.targetWeight,
                }
              : s
          )
      );

      // 세트 완료 후 휴식 타이머 자동 시작
      const restSeconds = set.restSeconds ?? exercise.restSeconds ?? 60;
      const allSetsCompleted = newExercises[exerciseIndex].sets.every(
        (s) => s.completed
      );

      return {
        ...state,
        exercises: newExercises,
        restTimer: allSetsCompleted
          ? state.restTimer // 모든 세트 완료 시 휴식 없음
          : { active: true, remaining: restSeconds, total: restSeconds },
      };
    }

    case 'UNDO_SET': {
      const { exerciseIndex, setIndex } = action;
      return {
        ...state,
        exercises: updateExerciseSets(
          state.exercises,
          exerciseIndex,
          (sets) =>
            sets.map((s, i) =>
              i === setIndex ? { ...s, completed: false } : s
            )
        ),
        restTimer: { active: false, remaining: 0, total: 0 },
      };
    }

    case 'UPDATE_SET_VALUE': {
      const { exerciseIndex, setIndex, field, value } = action;
      return {
        ...state,
        exercises: updateExerciseSets(
          state.exercises,
          exerciseIndex,
          (sets) =>
            sets.map((s, i) => (i === setIndex ? { ...s, [field]: value } : s))
        ),
      };
    }

    case 'START_REST':
      return {
        ...state,
        restTimer: {
          active: true,
          remaining: action.seconds,
          total: action.seconds,
        },
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

    case 'NEXT_EXERCISE': {
      const next = Math.min(
        state.currentExerciseIndex + 1,
        state.exercises.length - 1
      );
      return {
        ...state,
        currentExerciseIndex: next,
        restTimer: { active: false, remaining: 0, total: 0 },
      };
    }

    case 'PREV_EXERCISE': {
      const prev = Math.max(state.currentExerciseIndex - 1, 0);
      return {
        ...state,
        currentExerciseIndex: prev,
        restTimer: { active: false, remaining: 0, total: 0 },
      };
    }

    case 'GO_TO_EXERCISE':
      if (action.index < 0 || action.index >= state.exercises.length)
        return state;
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
      // overview phase에서만 외부 exercises prop 동기화 (active/complete 상태 보호)
      if (state.phase !== 'overview') return state;
      return {
        ...state,
        exercises: action.exercises,
      };

    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useWorkoutSession({
  exercises,
  eventId,
  date,
}: UseWorkoutSessionOptions): WorkoutSessionReturn {
  // localStorage에서 타이머 복원
  const savedTimer = useRef(restoreTimer(eventId));

  const [state, dispatch] = useReducer(workoutReducer, undefined, () => {
    const saved = savedTimer.current;
    if (saved) {
      return {
        phase: 'overview' as const,
        currentExerciseIndex: saved.currentExerciseIndex,
        exercises,
        restTimer: { active: false, remaining: 0, total: 0 },
        startedAt: saved.startedAt,
        completedAt: null,
        // 저장 시점에 pausedAt이 없었으면 (active 중 언마운트) 현재 시각으로 설정
        pausedAt: saved.pausedAt ?? Date.now(),
        pausedDuration: saved.pausedDuration,
      };
    }
    return {
      phase: 'overview' as const,
      currentExerciseIndex: 0,
      exercises,
      restTimer: { active: false, remaining: 0, total: 0 },
      startedAt: null,
      completedAt: null,
      pausedAt: null,
      pausedDuration: 0,
    };
  });

  // props → reducer 동기화: 이벤트 생성 직후 exercises가 [] → 실제 데이터로 바뀔 때 반영
  useEffect(() => {
    if (exercises.length > 0 && state.exercises.length === 0 && state.phase === 'overview') {
      dispatch({ type: 'SYNC_EXERCISES', exercises });
    }
  }, [exercises, state.exercises.length, state.phase]);

  const updateWorkout = useUpdateWorkoutData();

  // ── localStorage 타이머 영속화 ──
  const stateRef = useRef(state);
  stateRef.current = state;

  // 타이머 상태 변경 시 localStorage 저장
  useEffect(() => {
    if (!state.startedAt) return;

    if (state.phase === 'complete') {
      clearPersistedTimer();
      return;
    }

    persistTimer({
      eventId,
      startedAt: state.startedAt,
      pausedAt: state.pausedAt,
      pausedDuration: state.pausedDuration,
      currentExerciseIndex: state.currentExerciseIndex,
    });
  }, [eventId, state.startedAt, state.pausedAt, state.pausedDuration, state.currentExerciseIndex, state.phase]);

  // 언마운트 + beforeunload: active 중이면 paused로 저장
  useEffect(() => {
    const saveOnLeave = () => {
      const s = stateRef.current;
      if (s.startedAt && s.phase === 'active') {
        persistTimer({
          eventId,
          startedAt: s.startedAt,
          pausedAt: Date.now(),
          pausedDuration: s.pausedDuration,
          currentExerciseIndex: s.currentExerciseIndex,
        });
      }
    };

    window.addEventListener('beforeunload', saveOnLeave);
    return () => {
      window.removeEventListener('beforeunload', saveOnLeave);
      saveOnLeave(); // 컴포넌트 언마운트 시에도 저장
    };
  }, [eventId]);

  // 자동 저장: exercises 변경 시 debounce 500ms
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exercisesRef = useRef(state.exercises);
  exercisesRef.current = state.exercises;

  useEffect(() => {
    // overview phase에서는 저장하지 않음
    if (state.phase === 'overview') return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      updateWorkout.mutate({
        id: eventId,
        data: { exercises: exercisesRef.current },
        date,
        type: 'workout',
      });
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.exercises, state.phase, eventId]);

  // 휴식 타이머 인터벌
  useEffect(() => {
    if (!state.restTimer.active) return;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_REST' });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.restTimer.active]);

  // 스톱워치: 1초마다 경과 시간 갱신
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!state.startedAt || state.phase !== 'active') return;

    const update = () => {
      const elapsed = Math.floor(
        (Date.now() - state.startedAt! - state.pausedDuration) / 1000
      );
      setElapsedSeconds(elapsed);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [state.startedAt, state.pausedDuration, state.phase]);

  // 완료 시 최종 경과 시간 반영
  useEffect(() => {
    if (state.phase === 'complete' && state.startedAt && state.completedAt) {
      setElapsedSeconds(
        Math.floor((state.completedAt - state.startedAt - state.pausedDuration) / 1000)
      );
    }
  }, [state.phase, state.startedAt, state.completedAt, state.pausedDuration]);

  // 서버 동기화: 1분마다 경과 시간 저장
  useEffect(() => {
    if (state.phase !== 'active' || !state.startedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - state.startedAt! - state.pausedDuration) / 1000
      );
      updateWorkout.mutate({
        id: eventId,
        data: { exercises: exercisesRef.current, elapsedSeconds: elapsed },
        date,
        type: 'workout',
      });
    }, 60000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.startedAt, state.pausedDuration, eventId]);

  // 완료 시 최종 경과 시간 서버 저장
  useEffect(() => {
    if (state.phase !== 'complete' || !state.startedAt || !state.completedAt) return;

    const finalElapsed = Math.floor(
      (state.completedAt - state.startedAt - state.pausedDuration) / 1000
    );
    updateWorkout.mutate({
      id: eventId,
      data: { exercises: exercisesRef.current, elapsedSeconds: finalElapsed },
      date,
      type: 'workout',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.completedAt]);

  // 편의 함수
  const startWorkout = useCallback(() => dispatch({ type: 'START_WORKOUT' }), []);
  const completeSet = useCallback(
    (exerciseIdx: number, setIdx: number) =>
      dispatch({ type: 'COMPLETE_SET', exerciseIndex: exerciseIdx, setIndex: setIdx }),
    []
  );
  const undoSet = useCallback(
    (exerciseIdx: number, setIdx: number) =>
      dispatch({ type: 'UNDO_SET', exerciseIndex: exerciseIdx, setIndex: setIdx }),
    []
  );
  const updateSetValue = useCallback(
    (
      exerciseIdx: number,
      setIdx: number,
      field: 'actualReps' | 'actualWeight',
      value: number | undefined
    ) =>
      dispatch({
        type: 'UPDATE_SET_VALUE',
        exerciseIndex: exerciseIdx,
        setIndex: setIdx,
        field,
        value,
      }),
    []
  );
  const goToNextExercise = useCallback(() => dispatch({ type: 'NEXT_EXERCISE' }), []);
  const goToPrevExercise = useCallback(() => dispatch({ type: 'PREV_EXERCISE' }), []);
  const goToExercise = useCallback(
    (index: number) => dispatch({ type: 'GO_TO_EXERCISE', index }),
    []
  );
  const completeWorkout = useCallback(() => dispatch({ type: 'COMPLETE_WORKOUT' }), []);
  const exitWorkout = useCallback(() => dispatch({ type: 'EXIT_WORKOUT' }), []);
  const skipRest = useCallback(() => dispatch({ type: 'SKIP_REST' }), []);

  // 파생 값
  const currentExercise = state.exercises[state.currentExerciseIndex] ?? null;

  const { totalSetsCompleted, totalSets } = useMemo(() => {
    let completed = 0;
    let total = 0;
    for (const ex of state.exercises) {
      for (const s of ex.sets) {
        total++;
        if (s.completed) completed++;
      }
    }
    return { totalSetsCompleted: completed, totalSets: total };
  }, [state.exercises]);

  const isCurrentExerciseCompleted = currentExercise
    ? currentExercise.sets.every((s) => s.completed)
    : false;

  const isAllExercisesCompleted = totalSets > 0 && totalSetsCompleted === totalSets;

  const progress = totalSets > 0 ? totalSetsCompleted / totalSets : 0;

  const nextSetIndex = currentExercise
    ? currentExercise.sets.findIndex((s) => !s.completed)
    : -1;

  // startedAt이 있고 phase가 overview면 = 이전 세션 복원됨 (이어하기 가능)
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
