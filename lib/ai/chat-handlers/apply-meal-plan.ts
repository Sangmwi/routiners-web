import {
  executeApplyMealPlan,
  findMealPreviewMessageById,
  getMealPreviewStatus,
  buildAppliedMealConversationMetadata,
} from '@/lib/ai/executors';
import { handleApplyPreview } from './apply-preview-handler-helpers';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';

interface ApplyMealPlanArgs {
  preview_id: string;
}

export async function handleApplyMealPlan(
  fc: FunctionCallInfo,
  args: ApplyMealPlanArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  return handleApplyPreview({
    fc,
    ctx,
    previewId: args.preview_id,
    toolName: 'apply_meal_plan',
    appliedEventName: 'meal_plan_applied',
    findPreviewMessageById: findMealPreviewMessageById,
    getPreviewStatus: getMealPreviewStatus,
    executeApply: executeApplyMealPlan,
    buildAppliedConversationMetadata: buildAppliedMealConversationMetadata,
    previewNotFoundError: '식단 미리보기를 찾을 수 없습니다.',
    alreadyAppliedError: '이미 적용된 식단입니다.',
  });
}
