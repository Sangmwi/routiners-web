import {
  executeGenerateMealPlanPreview,
  checkMealDateConflicts,
} from '@/lib/ai/executors';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';
import { handleGeneratePreviewWithConflicts } from './generate-preview-handler-helpers';

type GenerateMealPlanPreviewArgs = Parameters<typeof executeGenerateMealPlanPreview>[0];

export async function handleGenerateMealPlanPreview(
  fc: FunctionCallInfo,
  args: GenerateMealPlanPreviewArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  return handleGeneratePreviewWithConflicts({
    fc,
    args,
    ctx,
    toolName: 'generate_meal_plan_preview',
    contentType: 'meal_preview',
    eventName: 'meal_preview',
    message: '식단 미리보기를 생성했습니다.',
    nextAction:
      '사용자가 적용 의사를 밝히면 적용 단계를 안내하고, 취소 의사를 밝히면 취소 후 일반 대화로 전환하세요.',
    executeGeneratePreview: executeGenerateMealPlanPreview,
    checkConflicts: checkMealDateConflicts,
  });
}
