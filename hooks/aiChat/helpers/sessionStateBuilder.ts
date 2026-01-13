/**
 * Session State Builder
 *
 * 세션 데이터로부터 ChatState를 생성하는 헬퍼
 * ChatState/INITIAL_STATE는 chatReducer.ts에서 import (Single Source of Truth)
 */

import type { ChatMessage, AISessionCompat } from '@/lib/types/chat';
import type { SessionPurpose } from '@/lib/types/routine';
import { createInitialGreetingMessage } from '@/lib/constants/aiChat';
import { extractSessionMetadata } from './sessionMetadata';
import { INITIAL_STATE, type ChatState } from './chatReducer';

// =============================================================================
// Helpers
// =============================================================================

/** UI에 표시할 메시지만 필터링 (tool_call, tool_result 제외) */
export function filterDisplayableMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((m) => m.contentType === 'text' || !m.contentType);
}

// =============================================================================
// State Builders
// =============================================================================

/**
 * 기존 세션 복귀 시 상태 생성
 * - DB 메시지 + 메타데이터로 상태 복구
 */
export function buildRestoredState(
  session: AISessionCompat,
  displayMessages: ChatMessage[]
): ChatState {
  const extracted = extractSessionMetadata(session.metadata);

  return {
    ...INITIAL_STATE,
    messages: displayMessages,
    pendingRoutinePreview: extracted.pendingRoutinePreview,
    appliedRoutine: extracted.appliedRoutine,
    pendingMealPreview: extracted.pendingMealPreview,
    appliedMealPlan: extracted.appliedMealPlan,
    pendingProfileConfirmation: extracted.pendingProfileConfirmation,
    pendingInput: extracted.pendingInput,
  };
}

/**
 * 새 세션 시작 시 상태 생성
 * - 초기 인사말 + 시작 대기 상태
 */
export function buildNewSessionState(
  sessionId: string,
  purpose: SessionPurpose
): ChatState {
  const greetingMessage = createInitialGreetingMessage(sessionId, purpose);

  return {
    ...INITIAL_STATE,
    messages: [greetingMessage],
    pendingStart: true,
  };
}

/**
 * 세션 데이터 업데이트 시 상태 머지
 * - 스트리밍 중이면 로컬 상태 유지
 * - 메타데이터는 DB가 source of truth
 */
export function mergeSessionUpdate(
  prevState: ChatState,
  session: AISessionCompat,
  displayMessages: ChatMessage[]
): ChatState {
  // 스트리밍 중이면 로컬 상태 유지
  if (prevState.isSending) return prevState;

  const extracted = extractSessionMetadata(session.metadata);

  return {
    ...prevState,
    // 메시지는 로컬 상태가 더 최신일 수 있으므로 유지
    messages: prevState.messages.length > 0 ? prevState.messages : displayMessages,
    // 메타데이터는 DB가 source of truth
    pendingRoutinePreview: extracted.pendingRoutinePreview,
    appliedRoutine: extracted.appliedRoutine,
    pendingMealPreview: extracted.pendingMealPreview,
    appliedMealPlan: extracted.appliedMealPlan,
    pendingProfileConfirmation: extracted.pendingProfileConfirmation,
    pendingInput: extracted.pendingInput,
  };
}
