/**
 * AI Tool Executors Index
 *
 * 도메인별로 분리된 도구 실행 함수들의 통합 export
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

// Routine Executors
export {
  executeSaveRoutineDraft,
  executeRequestUserInput,
  executeGenerateRoutinePreview,
  checkDateConflicts,
  executeApplyRoutine,
} from './routine';

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

// Import for internal use in executeTool
import type { ToolExecutorContext } from './types';
import { executeGetUserBasicInfo, executeGetUserMilitaryInfo, executeGetUserBodyMetrics } from './user-info';
import { executeGetFitnessProfile, executeUpdateFitnessProfile } from './fitness-profile';
import { executeSaveRoutineDraft } from './routine';
import { executeGetLatestInbody, executeGetInbodyHistory, executeGetCurrentRoutine } from './shared';
import { executeAddExercise, executeRemoveExercise, executeReorderExercises, executeUpdateExerciseSets } from './workout-editing';

// ============================================================================
// Main Executor
// ============================================================================

/**
 * 도구 실행 메인 함수
 */
export async function executeTool(
  toolName: AIToolName,
  args: Record<string, unknown>,
  ctx: ToolExecutorContext
): Promise<AIToolResult> {
  switch (toolName) {
    case 'get_user_basic_info':
      return executeGetUserBasicInfo(ctx);

    case 'get_user_military_info':
      return executeGetUserMilitaryInfo(ctx);

    case 'get_user_body_metrics':
      return executeGetUserBodyMetrics(ctx);

    case 'get_latest_inbody':
      return executeGetLatestInbody(ctx);

    case 'get_inbody_history':
      return executeGetInbodyHistory(ctx, args as { limit: number | null });

    case 'get_fitness_profile':
      return executeGetFitnessProfile(ctx);

    case 'update_fitness_profile':
      return executeUpdateFitnessProfile(ctx, args as Parameters<typeof executeUpdateFitnessProfile>[1]);

    case 'get_current_routine':
      return executeGetCurrentRoutine(ctx);

    case 'add_exercise_to_workout':
      return executeAddExercise(ctx, args as unknown as Parameters<typeof executeAddExercise>[1]);

    case 'remove_exercise_from_workout':
      return executeRemoveExercise(ctx, args as unknown as Parameters<typeof executeRemoveExercise>[1]);

    case 'reorder_workout_exercises':
      return executeReorderExercises(ctx, args as unknown as Parameters<typeof executeReorderExercises>[1]);

    case 'update_exercise_sets':
      return executeUpdateExerciseSets(ctx, args as unknown as Parameters<typeof executeUpdateExerciseSets>[1]);

    case 'save_routine_draft':
      return executeSaveRoutineDraft(ctx, args as Parameters<typeof executeSaveRoutineDraft>[1]);

    case 'request_user_input':
      // 이 도구는 API route에서 직접 처리 (input_request SSE 이벤트 전송)
      // executeTool을 통해 호출되면 안됨
      return { success: false, error: 'request_user_input은 API route에서 직접 처리해야 합니다.' };

    case 'confirm_profile_data':
      // 이 도구는 API route에서 직접 처리 (profile_confirmation SSE 이벤트 전송)
      // executeTool을 통해 호출되면 안됨
      return { success: false, error: 'confirm_profile_data는 API route에서 직접 처리해야 합니다.' };

    case 'generate_routine_preview':
      // 이 도구는 API route에서 직접 처리 (routine_preview SSE 이벤트 전송)
      // executeTool을 통해 호출되면 안됨
      return { success: false, error: 'generate_routine_preview는 API route에서 직접 처리해야 합니다.' };

    case 'apply_routine':
      // 이 도구는 API route에서 직접 처리 (preview 데이터 조회 필요)
      // executeTool을 통해 호출되면 안됨
      return { success: false, error: 'apply_routine은 API route에서 직접 처리해야 합니다.' };

    default:
      return { success: false, error: `알 수 없는 도구: ${toolName}` };
  }
}
