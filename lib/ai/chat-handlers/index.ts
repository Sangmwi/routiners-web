/**
 * AI Chat Handlers Index
 *
 * Tool handler 라우터 및 통합 export
 */

import { executeTool, ToolExecutorContext } from '@/lib/ai/tool-executor';
import { executeMealTool, type MealToolExecutorContext } from '@/lib/ai/meal-tool-executor';
import { handleRequestUserInput } from './request-user-input';
import { handleConfirmProfile } from './confirm-profile';
import { handleGenerateRoutinePreview } from './generate-routine-preview';
import { handleApplyRoutine } from './apply-routine';
import { handleGenerateMealPlanPreview } from './generate-meal-plan-preview';
import { handleApplyMealPlan } from './apply-meal-plan';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';
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
 * Tool Handler 라우터
 *
 * 도구 이름에 따라 적절한 handler로 라우팅
 */
export async function handleToolCall(
  fc: FunctionCallInfo,
  toolName: AIToolName,
  args: Record<string, unknown>,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  // 특별 처리 도구들
  switch (toolName) {
    case 'request_user_input':
      return handleRequestUserInput(fc, args as unknown as Parameters<typeof handleRequestUserInput>[1], ctx);

    case 'confirm_profile_data':
      return handleConfirmProfile(fc, args as unknown as Parameters<typeof handleConfirmProfile>[1], ctx);

    case 'generate_routine_preview':
      return handleGenerateRoutinePreview(fc, args as unknown as Parameters<typeof handleGenerateRoutinePreview>[1], ctx);

    case 'apply_routine':
      return handleApplyRoutine(fc, args as unknown as Parameters<typeof handleApplyRoutine>[1], ctx);

    case 'generate_meal_plan_preview':
      return handleGenerateMealPlanPreview(fc, args as unknown as Parameters<typeof handleGenerateMealPlanPreview>[1], ctx);

    case 'apply_meal_plan':
      return handleApplyMealPlan(fc, args as unknown as Parameters<typeof handleApplyMealPlan>[1], ctx);

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
