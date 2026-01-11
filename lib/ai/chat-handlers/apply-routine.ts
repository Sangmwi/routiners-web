/**
 * Apply Routine Handler
 *
 * apply_routine 도구 처리
 * 미리보기 루틴을 실제 일정에 적용
 */

import { executeApplyRoutine, type ToolExecutorContext } from '@/lib/ai/executors';
import { getMetadata, transitionToApplied } from './metadata-manager';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';
import type { RoutinePreviewData } from '@/lib/types/fitness';

interface ApplyRoutineArgs {
  preview_id: string;
}

export async function handleApplyRoutine(
  fc: FunctionCallInfo,
  args: ApplyRoutineArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const previewId = args.preview_id;

  // conversation.metadata에서 pending_preview 가져오기
  const metadata = await getMetadata(ctx.supabase, ctx.conversationId);
  const previewData = metadata.pending_preview as RoutinePreviewData | undefined;

  // previewId가 일치하는지 확인 (보안 검증)
  if (!previewData || previewData.id !== previewId) {
    return {
      toolResult: JSON.stringify({
        success: false,
        error: '미리보기 데이터를 찾을 수 없습니다. 다시 루틴을 생성해주세요.',
      }),
      continueLoop: false,
    };
  }

  // 루틴 적용 실행
  const toolCtx: ToolExecutorContext = {
    userId: ctx.userId,
    supabase: ctx.supabase,
    conversationId: ctx.conversationId,
  };
  const applyResult = await executeApplyRoutine(toolCtx, previewData);

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'apply_routine',
    success: applyResult.success,
    data: applyResult.data,
    error: applyResult.error,
  });

  if (applyResult.success && applyResult.data) {
    // 루틴 적용 성공 이벤트
    ctx.sendEvent('routine_applied', {
      previewId,
      eventsCreated: applyResult.data.eventsCreated,
      startDate: applyResult.data.startDate,
    });

    // pending_preview 제거하고 applied_routine 저장
    await transitionToApplied(
      ctx.supabase,
      ctx.conversationId,
      'pending_preview',
      'applied_routine',
      {
        previewId,
        eventsCreated: applyResult.data.eventsCreated,
        startDate: applyResult.data.startDate,
      }
    );
  }

  return {
    toolResult: JSON.stringify(applyResult),
    continueLoop: false, // 적용 후 종료
  };
}
