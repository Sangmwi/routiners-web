/**
 * Workout Editing Executors
 *
 * 기존 루틴 이벤트의 운동을 편집하는 도구 실행기.
 * workoutDataOperations.ts 순수 함수를 UI 편집 모드와 공유.
 *
 * 패턴: fetchWorkoutEvent → 순수 함수 적용 → saveWorkoutData
 */

import type { AIToolResult } from '@/lib/types';
import type { WorkoutData, WorkoutExercise, WorkoutSet } from '@/lib/types/routine';
import {
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  reorderWorkoutExercises,
  updateExerciseSets,
} from '@/lib/utils/workoutDataOperations';
import type { ToolExecutorContext } from './types';

// ============================================================================
// Types
// ============================================================================

interface AddExerciseArgs {
  routine_event_id: string;
  exercise: {
    name: string;
    category?: string;
    targetMuscle?: string;
    sets: Array<{
      setNumber: number;
      targetReps: number;
      targetWeight?: number;
      restSeconds?: number;
    }>;
    restSeconds?: number;
  };
}

interface RemoveExerciseArgs {
  routine_event_id: string;
  exercise_id: string;
}

interface ReorderExercisesArgs {
  routine_event_id: string;
  ordered_exercise_ids: string[];
}

interface UpdateExerciseSetsArgs {
  routine_event_id: string;
  exercise_id: string;
  sets: Array<{
    setNumber: number;
    targetReps: number;
    targetWeight?: number;
    restSeconds?: number;
  }>;
}

interface WorkoutEventRow {
  id: string;
  data: WorkoutData | null;
  status: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * 루틴 이벤트 조회 + 권한 검증
 */
async function fetchWorkoutEvent(
  ctx: ToolExecutorContext,
  eventId: string,
): Promise<{ event: WorkoutEventRow; data: WorkoutData } | AIToolResult> {
  const { data: event, error } = await ctx.supabase
    .from('routine_events')
    .select('id, data, status')
    .eq('id', eventId)
    .eq('user_id', ctx.userId)
    .eq('type', 'workout')
    .single();

  if (error || !event) {
    return { success: false, error: '해당 루틴 이벤트를 찾을 수 없습니다.' };
  }

  const workoutData = event.data as WorkoutData | null;
  if (!workoutData?.exercises) {
    return { success: false, error: '운동 데이터가 없는 이벤트입니다.' };
  }

  return { event: event as WorkoutEventRow, data: workoutData };
}

/**
 * 변경된 운동 데이터 저장
 */
async function saveWorkoutData(
  ctx: ToolExecutorContext,
  eventId: string,
  data: WorkoutData,
): Promise<AIToolResult | null> {
  const { error } = await ctx.supabase
    .from('routine_events')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .eq('user_id', ctx.userId);

  if (error) {
    return { success: false, error: '루틴 이벤트 저장에 실패했습니다.' };
  }

  return null; // 성공
}

// ============================================================================
// Executors
// ============================================================================

/**
 * add_exercise_to_workout
 */
export async function executeAddExercise(
  ctx: ToolExecutorContext,
  args: AddExerciseArgs,
): Promise<AIToolResult> {
  const result = await fetchWorkoutEvent(ctx, args.routine_event_id);
  if ('success' in result) return result;

  const { data } = result;

  // 운동 객체 생성 (ID 자동 부여)
  const exercise: WorkoutExercise = {
    id: crypto.randomUUID(),
    name: args.exercise.name,
    category: args.exercise.category,
    targetMuscle: args.exercise.targetMuscle,
    sets: args.exercise.sets as WorkoutSet[],
    restSeconds: args.exercise.restSeconds,
  };

  const updatedData = addExerciseToWorkout(data, exercise);

  const saveError = await saveWorkoutData(ctx, args.routine_event_id, updatedData);
  if (saveError) return saveError;

  return {
    success: true,
    data: {
      message: `'${exercise.name}' 운동이 추가되었습니다.`,
      exerciseId: exercise.id,
      totalExercises: updatedData.exercises.length,
    },
  };
}

/**
 * remove_exercise_from_workout
 */
export async function executeRemoveExercise(
  ctx: ToolExecutorContext,
  args: RemoveExerciseArgs,
): Promise<AIToolResult> {
  const result = await fetchWorkoutEvent(ctx, args.routine_event_id);
  if ('success' in result) return result;

  const { data } = result;

  // 최소 1개 운동 유지 검증
  if (data.exercises.length <= 1) {
    return { success: false, error: '최소 1개 운동은 남아야 합니다.' };
  }

  // 운동 존재 여부 확인
  const exercise = data.exercises.find((e) => e.id === args.exercise_id);
  if (!exercise) {
    return { success: false, error: '해당 운동을 찾을 수 없습니다.' };
  }

  const updatedData = removeExerciseFromWorkout(data, args.exercise_id);

  const saveError = await saveWorkoutData(ctx, args.routine_event_id, updatedData);
  if (saveError) return saveError;

  return {
    success: true,
    data: {
      message: `'${exercise.name}' 운동이 삭제되었습니다.`,
      totalExercises: updatedData.exercises.length,
    },
  };
}

/**
 * reorder_workout_exercises
 */
export async function executeReorderExercises(
  ctx: ToolExecutorContext,
  args: ReorderExercisesArgs,
): Promise<AIToolResult> {
  const result = await fetchWorkoutEvent(ctx, args.routine_event_id);
  if ('success' in result) return result;

  const { data } = result;

  const updatedData = reorderWorkoutExercises(data, args.ordered_exercise_ids);

  const saveError = await saveWorkoutData(ctx, args.routine_event_id, updatedData);
  if (saveError) return saveError;

  return {
    success: true,
    data: {
      message: '운동 순서가 변경되었습니다.',
      exercises: updatedData.exercises.map((e) => ({ id: e.id, name: e.name })),
    },
  };
}

/**
 * update_exercise_sets
 */
export async function executeUpdateExerciseSets(
  ctx: ToolExecutorContext,
  args: UpdateExerciseSetsArgs,
): Promise<AIToolResult> {
  const result = await fetchWorkoutEvent(ctx, args.routine_event_id);
  if ('success' in result) return result;

  const { data } = result;

  // 운동 존재 여부 확인
  const exercise = data.exercises.find((e) => e.id === args.exercise_id);
  if (!exercise) {
    return { success: false, error: '해당 운동을 찾을 수 없습니다.' };
  }

  const updatedData = updateExerciseSets(data, args.exercise_id, args.sets as WorkoutSet[]);

  const saveError = await saveWorkoutData(ctx, args.routine_event_id, updatedData);
  if (saveError) return saveError;

  return {
    success: true,
    data: {
      message: `'${exercise.name}' 세트가 수정되었습니다.`,
      setsCount: args.sets.length,
    },
  };
}
