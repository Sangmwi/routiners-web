'use client';

import type { AIToolStatus, AIToolName } from '@/lib/types/fitness';
import type { ChatMessage } from '@/lib/types/chat';

interface ToolDisplayState {
  displayedTools: AIToolStatus[];
}

/**
 * 사용자에게 보여줄 필요 없는 내부/데이터 조회 도구
 * - 프로세스 관리: set_active_purpose, clear_active_purpose
 * - 데이터 조회: get_user_*, get_fitness_profile, get_*_inbody
 * - 프로필 업데이트: update_fitness_profile
 * - UI 트리거 (자체 렌더링): request_user_input, confirm_profile_data
 */
const SILENT_TOOLS: Set<AIToolName> = new Set([
  'set_active_purpose',
  'clear_active_purpose',
  'get_user_basic_info',
  'get_user_military_info',
  'get_user_body_metrics',
  'get_latest_inbody',
  'get_inbody_history',
  'get_fitness_profile',
  'update_fitness_profile',
  'request_user_input',
  'confirm_profile_data',
]);

/**
 * 도구 상태 표시 관리 훅
 *
 * - 내부 도구(데이터 조회, 프로세스 관리)는 숨김
 * - 사용자에게 의미 있는 도구만 표시 (루틴 생성, 적용, 수정 등)
 * - 최대 3개까지만 표시 (줄바꿈 방지)
 */
export function useToolDisplayState(
  activeTools: AIToolStatus[],
  _streamingContent: string | undefined,
  _messages: ChatMessage[]
): ToolDisplayState {
  // 내부 도구 필터 → 최대 3개
  const displayedTools = activeTools
    .filter((t) => !SILENT_TOOLS.has(t.name))
    .slice(0, 3);

  return { displayedTools };
}
