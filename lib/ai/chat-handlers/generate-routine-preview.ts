/**
 * Generate Routine Preview Handler
 *
 * generate_routine_preview 도구 처리
 * 2주 운동 루틴 미리보기 생성
 *
 * Phase 9: 메시지 기반 트랜지언트 UI
 * - 루틴 미리보기 카드를 chat_messages 테이블에 저장
 * - content_type: 'routine_preview'
 * - 액션 후에도 히스토리에서 확인 가능
 */

import { executeGenerateRoutinePreview, checkDateConflicts, type ToolExecutorContext } from '@/lib/ai/executors';
import { updateMetadata } from './metadata-manager';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';

type GenerateRoutinePreviewArgs = Parameters<typeof executeGenerateRoutinePreview>[0];

export async function handleGenerateRoutinePreview(
  fc: FunctionCallInfo,
  args: GenerateRoutinePreviewArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const previewResult = executeGenerateRoutinePreview(args, fc.id);

  let messageId: string | undefined;

  if (previewResult.success && previewResult.data) {
    // 충돌 체크 수행
    const toolCtx: ToolExecutorContext = {
      userId: ctx.userId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
    };
    const conflicts = await checkDateConflicts(toolCtx, previewResult.data);
    if (conflicts.length > 0) {
      previewResult.data.conflicts = conflicts;
    }

    // 🆕 Phase 9: 메시지 테이블에 저장 (영구 보존)
    const { data: insertedMessage, error: insertError } = await ctx.supabase
      .from('chat_messages')
      .insert({
        conversation_id: ctx.conversationId,
        sender_id: null,
        role: 'assistant',
        content: JSON.stringify(previewResult.data),
        content_type: 'routine_preview',
        metadata: {
          status: 'pending', // 'pending' | 'applied' | 'cancelled'
        },
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[generate_routine_preview] Failed to save message:', insertError);
    } else {
      messageId = insertedMessage?.id;
    }

    // routine_preview SSE 이벤트 전송 (messageId 포함)
    ctx.sendEvent('routine_preview', {
      ...previewResult.data,
      messageId, // 클라이언트에서 상태 업데이트용
    });

    // 🔄 pending_input 정리 (슬라이더 등 이전 입력 요청 제거)
    // pending_preview는 더 이상 필요 없음 (메시지로 저장됨)
    const { error } = await updateMetadata(ctx.supabase, ctx.conversationId, {
      pending_input: undefined,
    });

    if (error) {
      console.error('[generate_routine_preview] Failed to clear pending_input:', error);
    }
  }

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'generate_routine_preview',
    success: previewResult.success,
    data: { previewId: previewResult.data?.id, messageId },
    error: previewResult.error,
  });

  return {
    toolResult: JSON.stringify({
      success: true,
      waiting_for_confirmation: true,
      message: '루틴 미리보기가 표시되었습니다. 사용자가 "적용하기" 또는 수정 요청을 할 때까지 기다리세요.',
      preview_id: previewResult.data?.id,
    }),
    continueLoop: false, // 사용자 확인 대기
  };
}
