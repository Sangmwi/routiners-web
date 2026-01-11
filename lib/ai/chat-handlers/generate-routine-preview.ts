/**
 * Generate Routine Preview Handler
 *
 * generate_routine_preview 도구 처리
 * 2주 운동 루틴 미리보기 생성
 */

import { executeGenerateRoutinePreview, checkDateConflicts, ToolExecutorContext } from '@/lib/ai/tool-executor';
import { updateMetadata } from './metadata-manager';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';

type GenerateRoutinePreviewArgs = Parameters<typeof executeGenerateRoutinePreview>[0];

export async function handleGenerateRoutinePreview(
  fc: FunctionCallInfo,
  args: GenerateRoutinePreviewArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const previewResult = executeGenerateRoutinePreview(args, fc.id);

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

    // routine_preview SSE 이벤트 전송
    ctx.sendEvent('routine_preview', previewResult.data);

    // 미리보기 데이터를 metadata에 저장 + 이전 pending_input 정리
    const { error } = await updateMetadata(ctx.supabase, ctx.conversationId, {
      pending_preview: previewResult.data,
      pending_input: undefined,  // ✅ 이전 입력 요청 정리 (슬라이더 등)
    });

    if (error) {
      console.error('[generate_routine_preview] Failed to save preview_data:', error);
    }
  }

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'generate_routine_preview',
    success: previewResult.success,
    data: { previewId: previewResult.data?.id },
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
