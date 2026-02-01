'use client';

import type { AIToolStatus } from '@/lib/types/fitness';
import type { ChatMessage } from '@/lib/types/chat';

interface ToolDisplayState {
  displayedTools: AIToolStatus[];
}

/**
 * 도구 상태 표시 관리 훅
 *
 * 최대 3개까지만 표시합니다 (줄바꿈 방지).
 * 스트리밍/로딩 영역이 사라지면 함께 사라집니다.
 */
export function useToolDisplayState(
  activeTools: AIToolStatus[],
  _streamingContent: string | undefined,
  _messages: ChatMessage[]
): ToolDisplayState {
  // 최대 3개만 표시
  const displayedTools = activeTools.slice(0, 3);

  return { displayedTools };
}
