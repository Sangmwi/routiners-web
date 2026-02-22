import type { AIToolResult } from '@/lib/types';
import { updateMetadata } from './metadata-manager';
import type { FunctionCallInfo, ToolHandlerContext, ToolHandlerResult } from './types';

type PreviewContentType = 'routine_preview' | 'meal_preview';
type PreviewEventName = 'routine_preview' | 'meal_preview';
type PreviewToolName = 'generate_routine_preview' | 'generate_meal_plan_preview';

interface PersistPreviewMessageParams<TPreview extends object> {
  ctx: ToolHandlerContext;
  contentType: PreviewContentType;
  eventName: PreviewEventName;
  previewData: TPreview;
  logTag: PreviewToolName;
}

interface FinalizePreviewResultParams<TPreview extends object> {
  fc: FunctionCallInfo;
  ctx: ToolHandlerContext;
  toolName: PreviewToolName;
  previewResult: AIToolResult<TPreview>;
  contentType: PreviewContentType;
  eventName: PreviewEventName;
  message: string;
  nextAction: string;
}

/**
 * 미리보기 페이로드를 메시지로 영속화하고 SSE로 전송한다.
 */
async function persistAndEmitPreviewMessage<TPreview extends object>(
  params: PersistPreviewMessageParams<TPreview>
): Promise<string | undefined> {
  const { ctx, contentType, eventName, previewData, logTag } = params;

  const { data: insertedMessage, error: insertError } = await ctx.supabase
    .from('chat_messages')
    .insert({
      conversation_id: ctx.conversationId,
      sender_id: null,
      role: 'assistant',
      content: JSON.stringify(previewData),
      content_type: contentType,
      metadata: {
        status: 'pending', // 'pending' | 'applied' | 'cancelled'
      },
    })
    .select('id')
    .single();

  let messageId: string | undefined;
  if (insertError) {
    console.error(`[${logTag}] Failed to save message:`, insertError);
  } else {
    messageId = insertedMessage?.id;
  }

  ctx.sendEvent(eventName, {
    ...(previewData as Record<string, unknown>),
    messageId,
  });

  const { error: metadataError } = await updateMetadata(ctx.supabase, ctx.conversationId, {
    pending_input: undefined,
  });

  if (metadataError) {
    console.error(`[${logTag}] Failed to clear pending_input:`, metadataError);
  }

  return messageId;
}

/**
 * 미리보기 생성 핸들러의 공통 후처리(메시지 저장/이벤트/tool_done/응답 본문)를 처리한다.
 */
export async function finalizeGeneratedPreview<TPreview extends { id?: string }>(
  params: FinalizePreviewResultParams<TPreview>
): Promise<ToolHandlerResult> {
  const { fc, ctx, toolName, previewResult, contentType, eventName, message, nextAction } = params;

  let messageId: string | undefined;

  if (previewResult.success && previewResult.data) {
    messageId = await persistAndEmitPreviewMessage({
      ctx,
      contentType,
      eventName,
      previewData: previewResult.data,
      logTag: toolName,
    });
  }

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: toolName,
    success: previewResult.success,
    data: { previewId: previewResult.data?.id, messageId },
    error: previewResult.error,
  });

  return {
    toolResult: JSON.stringify({
      success: true,
      waiting_for_confirmation: true,
      preview_id: previewResult.data?.id,
      message,
      next_action: nextAction,
    }),
    continueLoop: false,
  };
}
