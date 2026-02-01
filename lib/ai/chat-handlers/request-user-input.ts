/**
 * Request User Input Handler
 *
 * request_user_input 도구 처리
 * 사용자에게 선택형 입력 UI를 표시
 *
 * Phase 9: 메시지 기반 트랜지언트 UI
 * - 입력 요청 카드를 chat_messages 테이블에 저장
 * - content_type: 'input_request'
 * - 액션 후에도 히스토리에서 확인 가능
 */

import { executeRequestUserInput } from '@/lib/ai/executors';
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

  let messageId: string | undefined;

  // message가 있으면 별도 text 메시지로 저장 (카드와 분리)
  if (args.message?.trim()) {
    await ctx.supabase.from('chat_messages').insert({
      conversation_id: ctx.conversationId,
      sender_id: null,
      role: 'assistant',
      content: args.message,
      content_type: 'text',
    });
  }

  // 🆕 Phase 9: 메시지 테이블에 저장 (영구 보존)
  if (inputResult.success && inputResult.data) {
    const { data: insertedMessage, error: insertError } = await ctx.supabase
      .from('chat_messages')
      .insert({
        conversation_id: ctx.conversationId,
        sender_id: null,
        role: 'assistant',
        content: JSON.stringify(inputResult.data),
        content_type: 'input_request',
        metadata: {
          status: 'pending', // 'pending' | 'submitted' | 'cancelled'
        },
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[request_user_input] Failed to save message:', insertError);
    } else {
      messageId = insertedMessage?.id;
    }

    // input_request SSE 이벤트 전송 (messageId 포함)
    ctx.sendEvent('input_request', {
      ...inputResult.data,
      messageId, // 클라이언트에서 상태 업데이트용
    });
  }

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'request_user_input',
    success: inputResult.success,
    data: { ...inputResult.data, messageId },
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
