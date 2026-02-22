/**
 * AI 채팅 핸들러 진입점
 *
 * 라우팅 원칙:
 * - 레지스트리 핸들러: 스키마 검증 + 도메인별 전용 처리
 * - 인라인 핸들러: 메타데이터 중심의 단순 처리
 * - 폴백 경로: 공용 executor 기반 일반 도구 처리
 */

import { executeTool, type ToolExecutorContext } from '@/lib/ai/executors';
import { toolRegistry } from './registry';
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
  ApplyRoutineArgsSchema,
  SetActivePurposeArgsSchema,
  GenerateRoutinePreviewArgsSchema,
  GenerateMealPlanPreviewArgsSchema,
  ApplyMealPlanArgsSchema,
} from './schemas';
import type { AIToolName } from '@/lib/types/fitness';
import type { ActivePurposeType } from '@/lib/types/counselor';
import {
  setActivePurpose as setActivePurposeFn,
  clearActivePurpose as clearActivePurposeFn,
} from './metadata-manager';
import { PURPOSE_START_INSTRUCTIONS } from './constants/purpose-start-instructions';

// =============================================================================
// 핸들러 등록
// =============================================================================

toolRegistry.register('request_user_input', RequestUserInputArgsSchema, handleRequestUserInput);
toolRegistry.register('confirm_profile_data', ConfirmProfileArgsSchema, handleConfirmProfile);
toolRegistry.register(
  'generate_routine_preview',
  GenerateRoutinePreviewArgsSchema,
  handleGenerateRoutinePreview
);
toolRegistry.register('apply_routine', ApplyRoutineArgsSchema, handleApplyRoutine);
toolRegistry.register(
  'generate_meal_plan_preview',
  GenerateMealPlanPreviewArgsSchema,
  handleGenerateMealPlanPreview
);
toolRegistry.register('apply_meal_plan', ApplyMealPlanArgsSchema, handleApplyMealPlan);

// =============================================================================
// 재수출
// =============================================================================

export type {
  ToolHandlerContext,
  ToolHandlerResult,
  FunctionCallInfo,
  ConversationMetadata,
} from './types';

export {
  getMetadata,
  updateMetadata,
  clearMetadataKeys,
  transitionToApplied,
} from './metadata-manager';

export {
  setActivePurpose,
  updateActivePurposeStage,
  clearActivePurpose,
  getActivePurpose,
} from './metadata-manager';

export {
  setPendingPreview,
  clearPendingPreview,
  getPendingPreview,
} from './metadata-manager';

// =============================================================================
// 도구 라우터
// =============================================================================

const inlineToolHandlers: Partial<
  Record<
    AIToolName,
    (
      fc: FunctionCallInfo,
      args: Record<string, unknown>,
      ctx: ToolHandlerContext
    ) => Promise<ToolHandlerResult>
  >
> = {
  set_active_purpose: handleSetActivePurpose,
  clear_active_purpose: (fc, _args, ctx) => handleClearActivePurpose(fc, ctx),
};

/**
 * StreamingLoop에서 호출되는 메인 도구 라우터
 */
export async function handleToolCall(
  fc: FunctionCallInfo,
  toolName: AIToolName,
  args: Record<string, unknown>,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  // 1) 레지스트리 경로: 스키마 검증 + 전용 핸들러
  const registryResult = await toolRegistry.execute(toolName, fc, args, ctx);
  if (registryResult) {
    return registryResult;
  }

  // 2) 인라인 경로: 단순 메타데이터 작업
  const inlineHandler = inlineToolHandlers[toolName];
  if (inlineHandler) {
    return inlineHandler(fc, args, ctx);
  }

  // 3) 폴백 경로: 공용 executor 처리
  return handleGeneralTool(fc, toolName, args, ctx);
}

// =============================================================================
// 인라인 핸들러
// =============================================================================

async function handleSetActivePurpose(
  fc: FunctionCallInfo,
  args: Record<string, unknown>,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const parsed = SetActivePurposeArgsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      toolResult: JSON.stringify({
        success: false,
        error: `[set_active_purpose] 인자 검증 실패: ${parsed.error.message}`,
      }),
      continueLoop: true,
    };
  }

  const purposeType = parsed.data.purposeType as ActivePurposeType;
  await setActivePurposeFn(ctx.supabase, ctx.conversationId, purposeType);

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'set_active_purpose',
    success: true,
  });

  return {
    toolResult: JSON.stringify({
      success: true,
      instructions: PURPOSE_START_INSTRUCTIONS[purposeType] ?? '',
    }),
    continueLoop: true,
  };
}

async function handleClearActivePurpose(
  fc: FunctionCallInfo,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  await clearActivePurposeFn(ctx.supabase, ctx.conversationId);

  // 프로세스 취소 시 최근 pending 미리보기 메시지도 함께 취소 상태로 맞춘다.
  const cancelledAt = new Date().toISOString();
  const previewTypes = ['routine_preview', 'meal_preview'] as const;

  for (const contentType of previewTypes) {
    const { data: previewMessage } = await ctx.supabase
      .from('chat_messages')
      .select('id')
      .eq('conversation_id', ctx.conversationId)
      .eq('content_type', contentType)
      .eq('metadata->>status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (previewMessage) {
      await ctx.supabase
        .from('chat_messages')
        .update({
          metadata: { status: 'cancelled', cancelledAt },
        })
        .eq('id', previewMessage.id);
    }
  }

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'clear_active_purpose',
    success: true,
  });

  return {
    toolResult: JSON.stringify({
      success: true,
      message: '프로세스를 취소했습니다. 일반 대화 모드로 돌아갑니다.',
      next_action: '사용자 요청이 있으면 새로운 프로세스를 다시 시작하세요.',
    }),
    continueLoop: true,
  };
}

/**
 * 에러 메시지 패턴으로 에러 유형 분류
 *
 * - missing_data: 프로필 데이터 미입력 (TDEE 계산 등)
 * - not_found: 조회 대상 없음 (인바디, 루틴 등)
 * - system: DB/네트워크 오류 등 시스템 장애
 */
function classifyErrorType(error: string): 'missing_data' | 'not_found' | 'system' {
  if (/필요한 정보가 없|정보를 먼저/.test(error)) return 'missing_data';
  if (/찾을 수 없|없는 이벤트|기록이 없/.test(error)) return 'not_found';
  return 'system';
}

async function handleGeneralTool(
  fc: FunctionCallInfo,
  toolName: AIToolName,
  args: Record<string, unknown>,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const toolCtx: ToolExecutorContext = {
    userId: ctx.userId,
    supabase: ctx.supabase,
    conversationId: ctx.conversationId,
  };
  const result = await executeTool(toolName, args, toolCtx);

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: toolName,
    success: result.success,
    data: result.data,
    error: result.error,
    ...(!result.success && result.error ? { errorType: classifyErrorType(result.error) } : {}),
  });

  return {
    toolResult: JSON.stringify(result),
    continueLoop: true,
  };
}
