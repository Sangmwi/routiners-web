/**
 * AI Chat Handlers Index
 *
 * Tool handler 라우터 및 통합 export
 */

import { executeTool, type ToolExecutorContext } from '@/lib/ai/executors';
import { executeMealTool, type MealToolExecutorContext } from '@/lib/ai/meal-tool-executor';
import { handleRequestUserInput } from './request-user-input';
import { handleConfirmProfile } from './confirm-profile';
import { handleGenerateRoutinePreview } from './generate-routine-preview';
import { handleApplyRoutine } from './apply-routine';
import { handleGenerateMealPlanPreview } from './generate-meal-plan-preview';
import { handleApplyMealPlan } from './apply-meal-plan';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';
import {
  RequestUserInputArgsSchema,
  ConfirmProfileArgsSchema,
  ApplyPreviewArgsSchema,
} from './types';
import type { AIToolName } from '@/lib/types/fitness';

// Re-export types
export type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo, ConversationMetadata } from './types';
export { getMetadata, updateMetadata, clearMetadataKeys, transitionToApplied } from './metadata-manager';

// 식단 전용 도구 목록
const MEAL_ONLY_TOOLS = [
  'get_dietary_profile',
  'update_dietary_profile',
  'calculate_daily_needs',
] as const;

/**
 * 검증 실패 결과 생성
 */
function createValidationError(toolName: string, error: string): ToolHandlerResult {
  return {
    toolResult: JSON.stringify({
      success: false,
      error: `[${toolName}] 인자 검증 실패: ${error}`,
    }),
    continueLoop: true,
  };
}

/**
 * Tool Handler 라우터
 *
 * 도구 이름에 따라 적절한 handler로 라우팅
 * Zod 스키마로 인자를 검증하여 타입 안전성 확보
 */
export async function handleToolCall(
  fc: FunctionCallInfo,
  toolName: AIToolName,
  args: Record<string, unknown>,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  // 특별 처리 도구들 (Zod 검증 적용)
  switch (toolName) {
    case 'request_user_input': {
      const parsed = RequestUserInputArgsSchema.safeParse(args);
      if (!parsed.success) {
        return createValidationError(toolName, parsed.error.message);
      }
      return handleRequestUserInput(fc, parsed.data, ctx);
    }

    case 'confirm_profile_data': {
      const parsed = ConfirmProfileArgsSchema.safeParse(args);
      if (!parsed.success) {
        return createValidationError(toolName, parsed.error.message);
      }
      return handleConfirmProfile(fc, parsed.data, ctx);
    }

    case 'generate_routine_preview':
      // generate_routine_preview는 executor 내부에서 검증 (복잡한 nested 구조)
      return handleGenerateRoutinePreview(fc, args as Parameters<typeof handleGenerateRoutinePreview>[1], ctx);

    case 'apply_routine': {
      const parsed = ApplyPreviewArgsSchema.safeParse(args);
      if (!parsed.success) {
        return createValidationError(toolName, parsed.error.message);
      }
      return handleApplyRoutine(fc, parsed.data, ctx);
    }

    case 'generate_meal_plan_preview':
      // generate_meal_plan_preview는 executor 내부에서 검증 (복잡한 nested 구조)
      return handleGenerateMealPlanPreview(fc, args as Parameters<typeof handleGenerateMealPlanPreview>[1], ctx);

    case 'apply_meal_plan': {
      const parsed = ApplyPreviewArgsSchema.safeParse(args);
      if (!parsed.success) {
        return createValidationError(toolName, parsed.error.message);
      }
      return handleApplyMealPlan(fc, parsed.data, ctx);
    }

    default:
      // 일반 도구 처리
      return handleGeneralTool(fc, toolName, args, ctx);
  }
}

/**
 * 일반 도구 처리 (식단 도구 또는 운동 도구)
 */
async function handleGeneralTool(
  fc: FunctionCallInfo,
  toolName: AIToolName,
  args: Record<string, unknown>,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  let result: { success: boolean; data?: unknown; error?: string };

  if (MEAL_ONLY_TOOLS.includes(toolName as typeof MEAL_ONLY_TOOLS[number])) {
    // 식단 전용 도구
    const mealCtx: MealToolExecutorContext = {
      userId: ctx.userId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
    };
    result = await executeMealTool(toolName, args, mealCtx);
  } else {
    // 운동 AI 도구
    const toolCtx: ToolExecutorContext = {
      userId: ctx.userId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
    };
    result = await executeTool(toolName, args, toolCtx);
  }

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: toolName,
    success: result.success,
    data: result.data,
    error: result.error,
  });

  return {
    toolResult: JSON.stringify(result),
    continueLoop: true, // 일반 도구 후에는 AI가 추가 응답 생성
  };
}
