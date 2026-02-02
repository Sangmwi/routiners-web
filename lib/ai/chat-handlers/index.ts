/**
 * AI Chat Handlers Index
 *
 * Phase 21-E: OCP 준수를 위한 레지스트리 기반 라우팅
 * - 새 핸들러 추가 시 switch문 수정 불필요
 * - 핸들러 등록만으로 확장 가능
 */

import { executeTool, type ToolExecutorContext } from '@/lib/ai/executors';
import { toolRegistry } from './registry';
import { handleRequestUserInput } from './request-user-input';
import { handleConfirmProfile } from './confirm-profile';
import { handleGenerateRoutinePreview } from './generate-routine-preview';
import { handleApplyRoutine } from './apply-routine';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';
import {
  RequestUserInputArgsSchema,
  ConfirmProfileArgsSchema,
  ApplyRoutineArgsSchema,
  SetActivePurposeArgsSchema,
  GenerateRoutinePreviewArgsSchema,
} from './schemas';
import type { AIToolName } from '@/lib/types/fitness';
import type { ActivePurposeType } from '@/lib/types/coach';
import {
  setActivePurpose as setActivePurposeFn,
  clearActivePurpose as clearActivePurposeFn,
} from './metadata-manager';

// =============================================================================
// Handler Registration (Phase 21-E: OCP)
// =============================================================================

toolRegistry.register('request_user_input', RequestUserInputArgsSchema, handleRequestUserInput);
toolRegistry.register('confirm_profile_data', ConfirmProfileArgsSchema, handleConfirmProfile);
toolRegistry.register(
  'generate_routine_preview',
  GenerateRoutinePreviewArgsSchema,
  handleGenerateRoutinePreview
);
toolRegistry.register('apply_routine', ApplyRoutineArgsSchema, handleApplyRoutine);

// =============================================================================
// Re-exports
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
// Tool Handler Router
// =============================================================================

/**
 * Tool Handler 라우터
 *
 * Phase 21-E: 레지스트리 기반 라우팅
 * - 등록된 핸들러는 레지스트리에서 자동 처리 (Zod 검증 포함)
 * - 인라인 핸들러만 switch문으로 처리
 */
export async function handleToolCall(
  fc: FunctionCallInfo,
  toolName: AIToolName,
  args: Record<string, unknown>,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  // 1. 레지스트리에서 처리 시도 (Zod 검증 자동 포함)
  const registryResult = await toolRegistry.execute(toolName, fc, args, ctx);
  if (registryResult) {
    return registryResult;
  }

  // 2. 인라인 핸들러 (간단한 DB 작업)
  switch (toolName) {
    case 'set_active_purpose':
      return handleSetActivePurpose(fc, args, ctx);

    case 'clear_active_purpose':
      return handleClearActivePurpose(fc, ctx);

    default:
      // 3. 일반 도구 처리 (executeTool)
      return handleGeneralTool(fc, toolName, args, ctx);
  }
}

// =============================================================================
// Inline Handlers (간단한 DB 작업)
// =============================================================================

/**
 * set_active_purpose 인라인 핸들러
 */
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

  const startInstructions: Record<string, string> = {
    routine_generation: `🚨 즉시 실행: get_user_basic_info, get_fitness_profile 호출 후 프로필이 비어있으면 request_user_input을 반드시 호출하세요.

⛔ 절대 금지: 텍스트로만 옵션 나열 (버튼이 표시되지 않음)

✅ 다음 응답에서 request_user_input 도구를 호출하세요:
{"message":"운동 목표를 선택해주세요","type":"radio","options":[{"value":"muscle_gain","label":"근육 증가 💪"},{"value":"fat_loss","label":"체지방 감소 🔥"},{"value":"endurance","label":"지구력 향상 🏃"},{"value":"general_fitness","label":"전반적 체력 🌟"}],"sliderConfig":null}`,
  };

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'set_active_purpose',
    success: true,
  });

  return {
    toolResult: JSON.stringify({
      success: true,
      instructions: startInstructions[purposeType] ?? '',
    }),
    continueLoop: true,
  };
}

/**
 * clear_active_purpose 인라인 핸들러
 */
async function handleClearActivePurpose(
  fc: FunctionCallInfo,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  await clearActivePurposeFn(ctx.supabase, ctx.conversationId);

  // pending 상태의 routine_preview 메시지를 'cancelled'로 업데이트
  const { data: previewMessage } = await ctx.supabase
    .from('chat_messages')
    .select('id')
    .eq('conversation_id', ctx.conversationId)
    .eq('content_type', 'routine_preview')
    .eq('metadata->>status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (previewMessage) {
    await ctx.supabase
      .from('chat_messages')
      .update({
        metadata: { status: 'cancelled', cancelledAt: new Date().toISOString() },
      })
      .eq('id', previewMessage.id);
  }

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'clear_active_purpose',
    success: true,
  });

  return {
    toolResult: JSON.stringify({
      success: true,
      message: '프로세스가 취소되었습니다. 일반 대화 모드로 돌아갑니다.',
      next_action:
        '사용자에게 "알겠습니다. 다음에 언제든 루틴 만들어드릴게요!"라고 친근하게 응답하세요.',
    }),
    continueLoop: true,
  };
}

/**
 * 일반 도구 처리 (코치 AI 도구)
 */
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
  });

  return {
    toolResult: JSON.stringify(result),
    continueLoop: true,
  };
}
