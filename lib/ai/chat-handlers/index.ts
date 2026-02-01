/**
 * AI Chat Handlers Index
 *
 * Tool handler 라우터 및 통합 export
 */

import { executeTool, type ToolExecutorContext } from '@/lib/ai/executors';
import { handleRequestUserInput } from './request-user-input';
import { handleConfirmProfile } from './confirm-profile';
import { handleGenerateRoutinePreview } from './generate-routine-preview';
import { handleApplyRoutine } from './apply-routine';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';
import {
  RequestUserInputArgsSchema,
  ConfirmProfileArgsSchema,
  ApplyPreviewArgsSchema,
} from './types';
import type { AIToolName } from '@/lib/types/fitness';
import type { ActivePurposeType } from '@/lib/types/coach';
import { setActivePurpose as setActivePurposeFn, clearActivePurpose as clearActivePurposeFn } from './metadata-manager';

// Re-export types
export type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo, ConversationMetadata } from './types';

// Core metadata operations
export { getMetadata, updateMetadata, clearMetadataKeys, transitionToApplied } from './metadata-manager';

// Active Purpose management
export {
  setActivePurpose,
  updateActivePurposeStage,
  clearActivePurpose,
  getActivePurpose,
} from './metadata-manager';

// Preview management
export {
  setPendingPreview,
  clearPendingPreview,
  getPendingPreview,
} from './metadata-manager';

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

    case 'set_active_purpose': {
      const purposeType = args.purposeType as ActivePurposeType;
      await setActivePurposeFn(ctx.supabase, ctx.conversationId, purposeType);

      // 프로세스별 시작 절차를 도구 결과로 반환
      const startInstructions: Record<string, string> = {
        routine_generation: `루틴 생성 프로세스 활성화됨.
시작 절차:
1. get_user_basic_info → 이름 확인
2. get_fitness_profile → 기존 프로필 조회
3. 프로필 있으면 → confirm_profile_data로 확인
4. 없으면 → 운동 목표부터 순서대로 질문
질문 형식: request_user_input 사용 (radio/checkbox/slider)
운동 목표 options: 근육 증가(muscle_gain), 체지방 감소(fat_loss), 지구력 향상(endurance), 전반적 체력(general_fitness)`,
      };

      ctx.sendEvent('tool_done', {
        toolCallId: fc.id,
        name: toolName,
        success: true,
      });

      return {
        toolResult: JSON.stringify({
          success: true,
          instructions: startInstructions[purposeType] ?? '',
        }),
        continueLoop: true, // AI가 바로 다음 도구 호출 가능
      };
    }

    case 'clear_active_purpose': {
      await clearActivePurposeFn(ctx.supabase, ctx.conversationId);

      ctx.sendEvent('tool_done', {
        toolCallId: fc.id,
        name: toolName,
        success: true,
      });

      // 프로세스 종료 후 사용자에게 안내 메시지를 보내도록 지시
      return {
        toolResult: JSON.stringify({
          success: true,
          message: '프로세스가 취소되었습니다. 일반 대화 모드로 돌아갑니다.',
        }),
        continueLoop: true, // AI가 사용자에게 취소 확인 메시지를 보낼 수 있도록
      };
    }

    default:
      // 일반 도구 처리
      return handleGeneralTool(fc, toolName, args, ctx);
  }
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
    continueLoop: true, // 일반 도구 후에는 AI가 추가 응답 생성
  };
}
