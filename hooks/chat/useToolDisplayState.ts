'use client';

import type { AIToolStatus, AIToolName } from '@/lib/types/fitness';
import type { ChatMessage } from '@/lib/types/chat';

export interface ToolDisplayState {
  displayedTools: AIToolStatus[];
}

/**
 * 프로세스 관리 및 자체 렌더링 UI 도구만 숨김
 * - set_active_purpose / clear_active_purpose: 내부 프로세스 전환
 * - request_user_input / confirm_profile_data: 별도 트랜지언트 UI로 렌더링
 */
const SILENT_TOOLS: Set<AIToolName> = new Set([
  'set_active_purpose',
  'clear_active_purpose',
  'request_user_input',
  'confirm_profile_data',
]);

/**
 * 도구 상태 표시 관리 훅
 *
 * - 프로세스 관리/UI 트리거만 숨김
 * - 나머지 도구는 전부 표시 (개수 제한 없음, 줄바꿈 허용)
 */
export function useToolDisplayState(
  activeTools: AIToolStatus[],
  _streamingContent: string | undefined,
  _messages: ChatMessage[]
): ToolDisplayState {
  const displayedTools = activeTools.filter((t) => !SILENT_TOOLS.has(t.name));
  return { displayedTools };
}
