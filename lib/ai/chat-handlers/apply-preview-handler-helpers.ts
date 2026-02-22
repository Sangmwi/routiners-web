import type { ToolExecutorContext } from '@/lib/ai/executors';
import type { AIToolResult } from '@/lib/types';
import type { FunctionCallInfo, ToolHandlerContext, ToolHandlerResult } from './types';
import { createToolExecutorContext } from './tool-handler-context';

interface ApplyResultData {
  eventsCreated?: number;
  startDate?: string;
}

interface PreviewLookupData<TPreview> {
  messageId: string;
  metadata: unknown;
  previewData: TPreview;
}

interface AppliedConversationMetadataParams {
  previewId: string;
  messageId: string;
  eventsCreated?: number;
  startDate?: string;
  appliedAt: string;
}

type BuildAppliedConversationMetadata = (
  existingMetadata: Record<string, unknown>,
  params: AppliedConversationMetadataParams
) => Record<string, unknown>;

interface HandleApplyPreviewParams<TPreview, TApplyResult extends ApplyResultData> {
  fc: FunctionCallInfo;
  ctx: ToolHandlerContext;
  previewId: string;
  toolName: 'apply_routine' | 'apply_meal_plan';
  appliedEventName: 'routine_applied' | 'meal_plan_applied';
  findPreviewMessageById: (
    supabase: ToolHandlerContext['supabase'],
    conversationId: string,
    previewId: string
  ) => Promise<AIToolResult<PreviewLookupData<TPreview>>>;
  getPreviewStatus: (metadata: unknown) => string | undefined;
  executeApply: (
    toolCtx: ToolExecutorContext,
    previewData: TPreview
  ) => Promise<AIToolResult<TApplyResult>>;
  buildAppliedConversationMetadata: BuildAppliedConversationMetadata;
  previewNotFoundError: string;
  alreadyAppliedError: string;
}

async function markPreviewMessageAsApplied(
  ctx: ToolHandlerContext,
  messageId: string,
  appliedAt: string
): Promise<void> {
  await ctx.supabase
    .from('chat_messages')
    .update({
      metadata: {
        status: 'applied',
        appliedAt,
      },
    })
    .eq('id', messageId);
}

async function markConversationAsApplied(
  ctx: ToolHandlerContext,
  params: AppliedConversationMetadataParams,
  buildAppliedConversationMetadata: BuildAppliedConversationMetadata
): Promise<void> {
  const { data: conversation } = await ctx.supabase
    .from('conversations')
    .select('metadata')
    .eq('id', ctx.conversationId)
    .single();

  const existingMetadata = (conversation?.metadata ?? {}) as Record<string, unknown>;

  await ctx.supabase
    .from('conversations')
    .update({
      ai_result_applied: true,
      ai_result_applied_at: params.appliedAt,
      metadata: buildAppliedConversationMetadata(existingMetadata, params),
    })
    .eq('id', ctx.conversationId);
}

export async function handleApplyPreview<TPreview, TApplyResult extends ApplyResultData>(
  params: HandleApplyPreviewParams<TPreview, TApplyResult>
): Promise<ToolHandlerResult> {
  const {
    fc,
    ctx,
    previewId,
    toolName,
    appliedEventName,
    findPreviewMessageById,
    getPreviewStatus,
    executeApply,
    buildAppliedConversationMetadata,
    previewNotFoundError,
    alreadyAppliedError,
  } = params;

  const previewLookup = await findPreviewMessageById(
    ctx.supabase,
    ctx.conversationId,
    previewId
  );

  if (!previewLookup.success || !previewLookup.data) {
    return {
      toolResult: JSON.stringify({
        success: false,
        error: previewLookup.error ?? previewNotFoundError,
      }),
      continueLoop: false,
    };
  }

  const { messageId, metadata, previewData } = previewLookup.data;
  if (getPreviewStatus(metadata) === 'applied') {
    return {
      toolResult: JSON.stringify({
        success: false,
        error: alreadyAppliedError,
      }),
      continueLoop: false,
    };
  }

  const applyResult = await executeApply(
    createToolExecutorContext(ctx),
    previewData
  );

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: toolName,
    success: applyResult.success,
    data: applyResult.data,
    error: applyResult.error,
  });

  if (applyResult.success && applyResult.data) {
    const appliedAt = new Date().toISOString();

    ctx.sendEvent(appliedEventName, {
      previewId,
      eventsCreated: applyResult.data.eventsCreated,
      startDate: applyResult.data.startDate,
    });

    await markPreviewMessageAsApplied(ctx, messageId, appliedAt);

    await markConversationAsApplied(
      ctx,
      {
        previewId,
        messageId,
        eventsCreated: applyResult.data.eventsCreated,
        startDate: applyResult.data.startDate,
        appliedAt,
      },
      buildAppliedConversationMetadata
    );
  }

  return {
    toolResult: JSON.stringify(applyResult),
    continueLoop: false,
  };
}
