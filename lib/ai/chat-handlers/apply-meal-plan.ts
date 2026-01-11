/**
 * Apply Meal Plan Handler
 *
 * apply_meal_plan 도구 처리
 * 미리보기 식단을 실제 일정에 적용
 */

import { executeApplyMealPlan, type MealToolExecutorContext } from '@/lib/ai/meal-tool-executor';
import { getMetadata, transitionToApplied } from './metadata-manager';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';
import type { MealPlanPreviewData } from '@/lib/types/meal';

interface ApplyMealPlanArgs {
  preview_id: string;
}

export async function handleApplyMealPlan(
  fc: FunctionCallInfo,
  args: ApplyMealPlanArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const previewId = args.preview_id;

  // conversation.metadata에서 pending_meal_preview 가져오기
  const metadata = await getMetadata(ctx.supabase, ctx.conversationId);
  const mealPreviewData = metadata.pending_meal_preview as MealPlanPreviewData | undefined;

  // previewId가 일치하는지 확인 (보안 검증)
  if (!mealPreviewData || mealPreviewData.id !== previewId) {
    return {
      toolResult: JSON.stringify({
        success: false,
        error: '미리보기 데이터를 찾을 수 없습니다. 다시 식단을 생성해주세요.',
      }),
      continueLoop: false,
    };
  }

  // 식단 적용 실행
  const mealCtx: MealToolExecutorContext = {
    userId: ctx.userId,
    supabase: ctx.supabase,
    conversationId: ctx.conversationId,
  };
  const applyResult = await executeApplyMealPlan(mealCtx, mealPreviewData);

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'apply_meal_plan',
    success: applyResult.success,
    data: applyResult.data,
    error: applyResult.error,
  });

  if (applyResult.success && applyResult.data) {
    // 식단 적용 성공 이벤트
    ctx.sendEvent('meal_plan_applied', {
      previewId,
      eventsCreated: applyResult.data.eventsCreated,
      startDate: applyResult.data.startDate,
    });

    // pending_meal_preview 제거하고 applied_meal_plan 저장
    await transitionToApplied(
      ctx.supabase,
      ctx.conversationId,
      'pending_meal_preview',
      'applied_meal_plan',
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
