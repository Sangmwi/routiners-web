import {
  executeApplyRoutine,
  findRoutinePreviewMessageById,
  getRoutinePreviewStatus,
  buildAppliedRoutineConversationMetadata,
} from '@/lib/ai/executors';
import { handleApplyPreview } from './apply-preview-handler-helpers';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';

interface ApplyRoutineArgs {
  preview_id: string;
}

export async function handleApplyRoutine(
  fc: FunctionCallInfo,
  args: ApplyRoutineArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  return handleApplyPreview({
    fc,
    ctx,
    previewId: args.preview_id,
    toolName: 'apply_routine',
    appliedEventName: 'routine_applied',
    findPreviewMessageById: findRoutinePreviewMessageById,
    getPreviewStatus: getRoutinePreviewStatus,
    executeApply: executeApplyRoutine,
    buildAppliedConversationMetadata: buildAppliedRoutineConversationMetadata,
    previewNotFoundError: '루틴 미리보기를 찾을 수 없습니다.',
    alreadyAppliedError: '이미 적용된 루틴 미리보기입니다.',
  });
}
