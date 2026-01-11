/**
 * Confirm Profile Handler
 *
 * confirm_profile_data 도구 처리
 * 사용자에게 프로필 확인 UI를 표시
 */

import { updateMetadata } from './metadata-manager';
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
  const confirmationRequest = {
    id: fc.id,
    title: args.title,
    description: args.description,
    fields: args.fields,
  };

  // profile_confirmation SSE 이벤트 전송
  ctx.sendEvent('profile_confirmation', confirmationRequest);

  // 프로필 확인 데이터를 metadata에 저장 (페이지 이탈 후 복귀 시 복원용)
  const { error } = await updateMetadata(ctx.supabase, ctx.conversationId, {
    pending_profile_confirmation: confirmationRequest,
  });

  if (error) {
    console.error('[confirm_profile_data] Failed to save confirmation:', error);
  }

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
