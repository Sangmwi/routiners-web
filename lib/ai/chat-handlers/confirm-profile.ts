/**
 * Confirm Profile Handler
 *
 * confirm_profile_data 도구 처리
 * 사용자에게 프로필 확인 UI를 표시
 *
 * Phase 9: 메시지 기반 트랜지언트 UI
 * - 프로필 확인 카드를 chat_messages 테이블에 저장
 * - content_type: 'profile_confirmation'
 * - 액션 후에도 히스토리에서 확인 가능
 */

import type { ToolHandlerContext, ToolHandlerResult, FunctionCallInfo } from './types';

interface ConfirmProfileArgs {
  title: string;
  description?: string;
  fields: Array<{
    key: string;
    label: string;
    value: string;
    displayValue: string;
  }>;
}

export async function handleConfirmProfile(
  fc: FunctionCallInfo,
  args: ConfirmProfileArgs,
  ctx: ToolHandlerContext
): Promise<ToolHandlerResult> {
  // description이 있으면 별도 텍스트 메시지로 저장 (카드와 분리)
  if (args.description?.trim()) {
    await ctx.supabase.from('chat_messages').insert({
      conversation_id: ctx.conversationId,
      sender_id: null,
      role: 'assistant',
      content: args.description,
      content_type: 'text',
    });
  }

  // confirmationRequest 구조화 데이터
  const confirmationRequest = {
    id: fc.id,
    title: args.title,
    fields: args.fields,
  };

  // 🆕 Phase 9: 메시지 테이블에 저장 (영구 보존)
  const { data: insertedMessage, error: insertError } = await ctx.supabase
    .from('chat_messages')
    .insert({
      conversation_id: ctx.conversationId,
      sender_id: null,
      role: 'assistant',
      content: JSON.stringify(confirmationRequest),
      content_type: 'profile_confirmation',
      metadata: {
        status: 'pending', // 'pending' | 'confirmed' | 'edited'
      },
    })
    .select('id')
    .single();

  if (insertError || !insertedMessage) {
    console.error('[confirm_profile_data] Failed to save message:', {
      error: insertError,
      conversationId: ctx.conversationId,
      contentLength: JSON.stringify(confirmationRequest).length,
      errorCode: insertError?.code,
      errorMessage: insertError?.message,
      errorDetails: insertError?.details,
    });
    // 메시지 저장 실패 시에도 SSE 이벤트는 전송 (클라이언트에서 fallback 처리)
    // 하지만 메시지가 없으면 새로고침 시 사라지므로 경고 로그 남김
    console.warn('[confirm_profile_data] Message not saved, UI will not persist on refresh');
  } else {
    console.log('[confirm_profile_data] Message saved successfully:', {
      messageId: insertedMessage.id,
      conversationId: ctx.conversationId,
    });
  }

  // profile_confirmation SSE 이벤트 전송 (messageId 포함)
  ctx.sendEvent('profile_confirmation', {
    ...confirmationRequest,
    messageId: insertedMessage?.id, // 클라이언트에서 상태 업데이트용
  });

  // 필드 정보 추출 (AI 컨텍스트용)
  const confirmedFields = args.fields.map((f) => f.key).join(', ');
  const confirmedLabels = args.fields.map((f) => f.label).join(', ');

  ctx.sendEvent('tool_done', {
    toolCallId: fc.id,
    name: 'confirm_profile_data',
    success: true,
    data: confirmationRequest,
  });

  return {
    toolResult: JSON.stringify({
      success: true,
      waiting_for_confirmation: true,
      confirmed_fields: confirmedFields,
      confirmed_labels: confirmedLabels,
      message: '프로필 확인 UI가 표시되었습니다.',
      next_action: `사용자가 "[프로필 확인 완료]"로 시작하는 메시지를 보내면 해당 정보(${confirmedLabels})가 확정된 것입니다. 이 경우 확정된 정보를 다시 묻지 말고 바로 다음 단계로 진행하세요. "[프로필 수정 요청]"으로 시작하면 수정할 항목을 물어보세요.`,
    }),
    continueLoop: false, // 사용자 확인 대기
  };
}
