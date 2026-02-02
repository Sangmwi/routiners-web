/**
 * 메시지 미리보기 포맷 유틸
 *
 * 채팅 목록에서 마지막 메시지를 미리보기로 표시할 때 사용
 * - 특수 메시지(JSON 형식)는 사용자 친화적인 텍스트로 변환
 * - 일반 텍스트는 그대로 반환
 */

import type { ChatMessage, ContentType } from '@/lib/types/chat';

/**
 * contentType별 미리보기 텍스트 매핑
 */
const PREVIEW_LABELS: Partial<Record<ContentType, string>> = {
  routine_preview: '📋 루틴 미리보기',
  profile_confirmation: '✅ 프로필 확인 요청',
  input_request: '❓ 선택 요청',
  tool_call: '',     // 숨김
  tool_result: '',   // 숨김
  system_log: '',    // 숨김
};

/**
 * 메시지를 채팅 목록 미리보기용 텍스트로 변환
 *
 * @param message - 채팅 메시지 객체
 * @returns 미리보기용 텍스트 (빈 문자열이면 표시하지 않음)
 *
 * @example
 * formatMessagePreview({ contentType: 'text', content: '안녕하세요' })
 * // => '안녕하세요'
 *
 * formatMessagePreview({ contentType: 'routine_preview', content: '{...}' })
 * // => '📋 루틴 미리보기'
 */
export function formatMessagePreview(message: ChatMessage): string {
  const label = PREVIEW_LABELS[message.contentType];

  // 매핑된 라벨이 있으면 사용 (빈 문자열도 의도된 값)
  if (label !== undefined) {
    return label;
  }

  // 기본: 원본 content 반환
  return message.content;
}
