/**
 * Generate Meal Plan Preview Handler
 *
 * generate_meal_plan_preview 도구 처리
 * 2주 식단 미리보기 생성
 */

import {
  executeGenerateMealPlanPreview,
  checkMealDateConflicts,
  type MealToolExecutorContext,
} from '@/lib/ai/meal-tool-executor';
import { updateMetadata } from './metadata-manager';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';

type GenerateMealPlanPreviewArgs = Parameters<typeof executeGenerateMealPlanPreview>[0];

export async function handleGenerateMealPlanPreview(
  fc: FunctionCallInfo,
  args: GenerateMealPlanPreviewArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const previewResult = executeGenerateMealPlanPreview(args, fc.id);

  if (previewResult.success && previewResult.data) {
    // 충돌 체크 수행
    const mealCtx: MealToolExecutorContext = {
      userId: ctx.userId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
    };
    const conflicts = await checkMealDateConflicts(mealCtx, previewResult.data);
    if (conflicts.length > 0) {
      previewResult.data.conflicts = conflicts;
    }

    // meal_plan_preview SSE 이벤트 전송
    ctx.sendEvent('meal_plan_preview', previewResult.data);

    // 미리보기 데이터를 metadata에 저장 + 이전 pending_input 정리
    const { error } = await updateMetadata(ctx.supabase, ctx.conversationId, {
      pending_meal_preview: previewResult.data,
      pending_input: undefined,  // ✅ 이전 입력 요청 정리 (슬라이더 등)
    });

    if (error) {
      console.error('[generate_meal_plan_preview] Failed to save preview_data:', error);
    }
  }

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'generate_meal_plan_preview',
    success: previewResult.success,
    data: { previewId: previewResult.data?.id },
    error: previewResult.error,
  });

  return {
    toolResult: JSON.stringify({
      success: true,
      waiting_for_confirmation: true,
      message: '식단 미리보기가 표시되었습니다. 사용자가 "적용하기" 또는 수정 요청을 할 때까지 기다리세요.',
      preview_id: previewResult.data?.id,
    }),
    continueLoop: false, // 사용자 확인 대기
  };
}
