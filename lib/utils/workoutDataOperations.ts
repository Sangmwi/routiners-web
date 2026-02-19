import type { WorkoutData, WorkoutExercise, WorkoutSet } from '@/lib/types/routine';

/**
 * 운동 데이터 순수 변환 함수
 *
 * UI 편집 모드와 향후 AI tool call에서 공유.
 * 모든 함수는 불변 변환 — 원본 수정 없음.
 */

/** 운동 추가 (목록 끝에 삽입) */
export function addExerciseToWorkout(
  data: WorkoutData,
  exercise: WorkoutExercise,
): WorkoutData {
  return {
    ...data,
    exercises: [...data.exercises, exercise],
  };
}

/** 운동 삭제 (최소 1개 유지는 호출자가 보장) */
export function removeExerciseFromWorkout(
  data: WorkoutData,
  exerciseId: string,
): WorkoutData {
  return {
    ...data,
    exercises: data.exercises.filter((e) => e.id !== exerciseId),
  };
}

/** 운동 순서 변경 (orderedIds 순서대로 재배치) */
export function reorderWorkoutExercises(
  data: WorkoutData,
  orderedIds: string[],
): WorkoutData {
  const exerciseMap = new Map(data.exercises.map((e) => [e.id, e]));
  const reordered = orderedIds
    .map((id) => exerciseMap.get(id))
    .filter((e): e is WorkoutExercise => !!e);
  return {
    ...data,
    exercises: reordered,
  };
}

/** 특정 운동의 세트 교체 */
export function updateExerciseSets(
  data: WorkoutData,
  exerciseId: string,
  sets: WorkoutSet[],
): WorkoutData {
  return {
    ...data,
    exercises: data.exercises.map((e) =>
      e.id === exerciseId ? { ...e, sets } : e,
    ),
  };
}
