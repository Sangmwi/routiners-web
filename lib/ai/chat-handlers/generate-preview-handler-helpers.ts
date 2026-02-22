import type { ToolExecutorContext } from '@/lib/ai/executors';
import type { AIToolResult } from '@/lib/types';
import type { FunctionCallInfo, ToolHandlerContext, ToolHandlerResult } from './types';
import { finalizeGeneratedPreview } from './preview-handler-helpers';
import { createToolExecutorContext } from './tool-handler-context';

type GenerateToolName = 'generate_routine_preview' | 'generate_meal_plan_preview';
type PreviewContentType = 'routine_preview' | 'meal_preview';
type PreviewEventName = 'routine_preview' | 'meal_preview';

interface HandleGeneratePreviewParams<
  TArgs,
  TPreview extends { id?: string; conflicts?: TConflict[] },
  TConflict,
> {
  fc: FunctionCallInfo;
  args: TArgs;
  ctx: ToolHandlerContext;
  toolName: GenerateToolName;
  contentType: PreviewContentType;
  eventName: PreviewEventName;
  message: string;
  nextAction: string;
  executeGeneratePreview: (
    args: TArgs,
    toolCallId: string
  ) => AIToolResult<TPreview>;
  checkConflicts: (
    toolCtx: ToolExecutorContext,
    previewData: TPreview
  ) => Promise<TConflict[]>;
}

export async function handleGeneratePreviewWithConflicts<
  TArgs,
  TPreview extends { id?: string; conflicts?: TConflict[] },
  TConflict,
>(
  params: HandleGeneratePreviewParams<TArgs, TPreview, TConflict>
): Promise<ToolHandlerResult> {
  const {
    fc,
    args,
    ctx,
    toolName,
    contentType,
    eventName,
    message,
    nextAction,
    executeGeneratePreview,
    checkConflicts,
  } = params;

  const previewResult = executeGeneratePreview(args, fc.id);

  if (previewResult.success && previewResult.data) {
    const conflicts = await checkConflicts(
      createToolExecutorContext(ctx),
      previewResult.data
    );
    if (conflicts.length > 0) {
      previewResult.data.conflicts = conflicts;
    }
  }

  return finalizeGeneratedPreview({
    fc,
    ctx,
    toolName,
    previewResult,
    contentType,
    eventName,
    message,
    nextAction,
  });
}
