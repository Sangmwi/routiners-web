/**
 * AI Tool Executors Index
 *
 * 도메인별 executor를 모아서 노출하고, 공용 executeTool 라우터를 제공한다.
 */

import type { AIToolName, AIToolResult } from '@/lib/types';

// Types
export type { ToolExecutorContext } from './types';
export type {
  UserBasicInfo,
  UserMilitaryInfo,
  UserBodyMetrics,
  TrainingPreferences,
  InjuriesRestrictions,
  FitnessProfile,
} from './types';

// User Info Executors
export {
  executeGetUserBasicInfo,
  executeGetUserMilitaryInfo,
  executeGetUserBodyMetrics,
} from './user-info';

// Fitness Profile Executors
export {
  executeGetFitnessProfile,
  executeUpdateFitnessProfile,
} from './fitness-profile';

// Dietary Profile Executors
export {
  executeGetDietaryProfile,
  executeUpdateDietaryProfile,
  executeCalculateDailyNeeds,
} from './dietary-profile';

// Routine Executors
export {
  executeSaveRoutineDraft,
  executeRequestUserInput,
  executeGenerateRoutinePreview,
  checkDateConflicts,
  executeApplyRoutine,
  findRoutinePreviewMessageById,
  getRoutinePreviewStatus,
  buildAppliedRoutineConversationMetadata,
} from './routine';

// Meal Plan Executors
export {
  executeGenerateMealPlanPreview,
  checkMealDateConflicts,
  executeApplyMealPlan,
  findMealPreviewMessageById,
  getMealPreviewStatus,
  buildAppliedMealConversationMetadata,
} from './meal-plan';

// Shared Executors
export {
  executeGetLatestInbody,
  executeGetInbodyHistory,
  executeGetCurrentRoutine,
} from './shared';

// Workout Editing Executors
export {
  executeAddExercise,
  executeRemoveExercise,
  executeReorderExercises,
  executeUpdateExerciseSets,
} from './workout-editing';

// executeTool 내부 라우팅에 사용할 import
import type { ToolExecutorContext } from './types';
import {
  executeGetUserBasicInfo,
  executeGetUserMilitaryInfo,
  executeGetUserBodyMetrics,
} from './user-info';
import {
  executeGetFitnessProfile,
  executeUpdateFitnessProfile,
} from './fitness-profile';
import {
  executeGetDietaryProfile,
  executeUpdateDietaryProfile,
  executeCalculateDailyNeeds,
} from './dietary-profile';
import { executeSaveRoutineDraft } from './routine';
import {
  executeGetLatestInbody,
  executeGetInbodyHistory,
  executeGetCurrentRoutine,
} from './shared';
import {
  executeAddExercise,
  executeRemoveExercise,
  executeReorderExercises,
  executeUpdateExerciseSets,
} from './workout-editing';

type ExecutorFn = (
  args: Record<string, unknown>,
  ctx: ToolExecutorContext
) => Promise<AIToolResult> | AIToolResult;

const castArgs = <T>(args: Record<string, unknown>) => args as unknown as T;

// 직접 실행 가능한 도구들.
// 새 도구는 여기만 추가하면 switch 없이 확장할 수 있다.
const DIRECT_EXECUTORS: Partial<Record<AIToolName, ExecutorFn>> = {
  get_user_basic_info: (_args, ctx) => executeGetUserBasicInfo(ctx),
  get_user_military_info: (_args, ctx) => executeGetUserMilitaryInfo(ctx),
  get_user_body_metrics: (_args, ctx) => executeGetUserBodyMetrics(ctx),
  get_latest_inbody: (_args, ctx) => executeGetLatestInbody(ctx),
  get_inbody_history: (args, ctx) =>
    executeGetInbodyHistory(ctx, castArgs<Parameters<typeof executeGetInbodyHistory>[1]>(args)),
  get_fitness_profile: (_args, ctx) => executeGetFitnessProfile(ctx),
  update_fitness_profile: (args, ctx) =>
    executeUpdateFitnessProfile(ctx, castArgs<Parameters<typeof executeUpdateFitnessProfile>[1]>(args)),
  get_dietary_profile: (_args, ctx) => executeGetDietaryProfile(ctx),
  update_dietary_profile: (args, ctx) =>
    executeUpdateDietaryProfile(ctx, castArgs<Parameters<typeof executeUpdateDietaryProfile>[1]>(args)),
  calculate_daily_needs: (_args, ctx) => executeCalculateDailyNeeds(ctx),
  get_current_routine: (_args, ctx) => executeGetCurrentRoutine(ctx),
  add_exercise_to_workout: (args, ctx) =>
    executeAddExercise(ctx, castArgs<Parameters<typeof executeAddExercise>[1]>(args)),
  remove_exercise_from_workout: (args, ctx) =>
    executeRemoveExercise(ctx, castArgs<Parameters<typeof executeRemoveExercise>[1]>(args)),
  reorder_workout_exercises: (args, ctx) =>
    executeReorderExercises(ctx, castArgs<Parameters<typeof executeReorderExercises>[1]>(args)),
  update_exercise_sets: (args, ctx) =>
    executeUpdateExerciseSets(ctx, castArgs<Parameters<typeof executeUpdateExerciseSets>[1]>(args)),
  save_routine_draft: (args, ctx) =>
    executeSaveRoutineDraft(ctx, castArgs<Parameters<typeof executeSaveRoutineDraft>[1]>(args)),
};

// API route에서 직접 처리해야 하는 도구들의 공통 에러 메시지.
const ROUTE_ONLY_TOOL_ERRORS: Partial<Record<AIToolName, string>> = {
  request_user_input: 'request_user_input은 API route에서 직접 처리해야 합니다.',
  confirm_profile_data: 'confirm_profile_data는 API route에서 직접 처리해야 합니다.',
  generate_routine_preview: 'generate_routine_preview는 API route에서 직접 처리해야 합니다.',
  apply_routine: 'apply_routine은 API route에서 직접 처리해야 합니다.',
  generate_meal_plan_preview: 'generate_meal_plan_preview는 API route에서 직접 처리해야 합니다.',
  apply_meal_plan: 'apply_meal_plan은 API route에서 직접 처리해야 합니다.',
  set_active_purpose: 'set_active_purpose는 API route에서 직접 처리해야 합니다.',
  clear_active_purpose: 'clear_active_purpose는 API route에서 직접 처리해야 합니다.',
};

/**
 * 공용 executor 라우터를 통해 도구를 실행한다.
 */
export async function executeTool(
  toolName: AIToolName,
  args: Record<string, unknown>,
  ctx: ToolExecutorContext
): Promise<AIToolResult> {
  const executor = DIRECT_EXECUTORS[toolName];
  if (executor) {
    return executor(args, ctx);
  }

  const routeOnlyError = ROUTE_ONLY_TOOL_ERRORS[toolName];
  if (routeOnlyError) {
    return { success: false, error: routeOnlyError };
  }

  return { success: false, error: `알 수 없는 도구: ${toolName}` };
}
