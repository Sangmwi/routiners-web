/**
 * Apply Routine Handler
 *
 * apply_routine 도구 처리
 * 미리보기 루틴을 실제 일정에 적용
 *
 * Phase 9: chat_messages 테이블에서 routine_preview 메시지로 데이터 가져와서 적용
 */

import { executeApplyRoutine, type ToolExecutorContext } from '@/lib/ai/executors';
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

  // Phase 9: chat_messages에서 routine_preview 메시지 조회
  const { data: previewMessage, error: msgError } = await ctx.supabase
    .from('chat_messages')
    .select('id, content, metadata')
    .eq('conversation_id', ctx.conversationId)
    .eq('content_type', 'routine_preview')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (msgError || !previewMessage) {
    return {
      toolResult: JSON.stringify({
        success: false,
        error: '미리보기 데이터를 찾을 수 없습니다. 다시 루틴을 생성해주세요.',
      }),
      continueLoop: false,
    };
  }

  // 메시지 상태 확인 (이미 적용됨/취소됨 체크)
  const msgMetadata = previewMessage.metadata as { status?: string } | null;
  if (msgMetadata?.status === 'applied') {
    return {
      toolResult: JSON.stringify({
        success: false,
        error: '이미 적용된 루틴입니다.',
      }),
      continueLoop: false,
    };
  }

  // content에서 preview 데이터 파싱
  let previewData: RoutinePreviewData;
  try {
    previewData = JSON.parse(previewMessage.content) as RoutinePreviewData;
  } catch {
    return {
      toolResult: JSON.stringify({
        success: false,
        error: '미리보기 데이터 파싱에 실패했습니다.',
      }),
      continueLoop: false,
    };
  }

  // previewId 일치 확인 (보안 검증)
  if (previewData.id !== previewId) {
    return {
      toolResult: JSON.stringify({
        success: false,
        error: '미리보기 ID가 일치하지 않습니다.',
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

    // Phase 9: 메시지 상태를 'applied'로 업데이트
    const appliedAt = new Date().toISOString();
    await ctx.supabase
      .from('chat_messages')
      .update({
        metadata: {
          status: 'applied',
          appliedAt,
        },
      })
      .eq('id', previewMessage.id);

    // 대화 상태 업데이트
    await ctx.supabase
      .from('conversations')
      .update({
        ai_result_applied: true,
        ai_result_applied_at: appliedAt,
        metadata: {
          applied_routine: {
            previewId,
            messageId: previewMessage.id,
            eventsCreated: applyResult.data.eventsCreated,
            startDate: applyResult.data.startDate,
            appliedAt,
          },
        },
      })
      .eq('id', ctx.conversationId);
  }

  return {
    toolResult: JSON.stringify(applyResult),
    continueLoop: false, // 적용 후 종료
  };
}
