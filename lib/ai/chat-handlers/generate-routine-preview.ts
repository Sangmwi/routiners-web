import {
  executeGenerateRoutinePreview,
  checkDateConflicts,
} from '@/lib/ai/executors';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';
import { handleGeneratePreviewWithConflicts } from './generate-preview-handler-helpers';

type GenerateRoutinePreviewArgs = Parameters<typeof executeGenerateRoutinePreview>[0];

export async function handleGenerateRoutinePreview(
  fc: FunctionCallInfo,
  args: GenerateRoutinePreviewArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  return handleGeneratePreviewWithConflicts({
    fc,
    args,
    ctx,
    toolName: 'generate_routine_preview',
    contentType: 'routine_preview',
    eventName: 'routine_preview',
    message: '루틴 미리보기를 생성했습니다.',
    nextAction:
      '사용자가 적용 의사를 밝히면 적용 단계를 안내하고, 취소 의사를 밝히면 취소 후 일반 대화로 전환하세요.',
    executeGeneratePreview: executeGenerateRoutinePreview,
    checkConflicts: checkDateConflicts,
  });
}
