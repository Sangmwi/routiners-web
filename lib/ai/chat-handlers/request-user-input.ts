/**
 * Request User Input Handler
 *
 * request_user_input 도구 처리
 * 사용자에게 선택형 입력 UI를 표시
 */

import { executeRequestUserInput } from '@/lib/ai/executors';
import { updateMetadata } from './metadata-manager';
import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';
import type { InputRequestType, InputRequestOption, InputRequestSliderConfig } from '@/lib/types/fitness';

interface RequestUserInputArgs {
  message?: string;
  type: InputRequestType;
  options?: InputRequestOption[];
  sliderConfig?: InputRequestSliderConfig;
}

export async function handleRequestUserInput(
  fc: FunctionCallInfo,
  args: RequestUserInputArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  const inputResult = executeRequestUserInput(args, fc.id);

  // SSE 이벤트 전송
  if (inputResult.success && inputResult.data) {
    ctx.sendEvent('input_request', inputResult.data);
  }

  // message가 있으면 별도 text 메시지로 저장 (새로고침 후에도 표시되도록)
  if (args.message?.trim()) {
    await ctx.supabase.from('chat_messages').insert({
      conversation_id: ctx.conversationId,
      sender_id: null,
      role: 'assistant',
      content: args.message,
      content_type: 'text',
    });
  }

  // pending_input을 metadata에 저장 (새로고침 후에도 버튼 UI 표시)
  if (inputResult.success && inputResult.data) {
    await updateMetadata(ctx.supabase, ctx.conversationId, {
      pending_input: inputResult.data,
    });
  }

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'request_user_input',
    success: inputResult.success,
    data: inputResult.data,
    error: inputResult.error,
  });

  return {
    toolResult: JSON.stringify({
      success: true,
      waiting_for_user: true,
      message: '사용자 입력 대기 중',
    }),
    continueLoop: false, // 사용자 입력 대기
  };
}
