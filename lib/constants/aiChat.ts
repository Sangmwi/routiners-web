/**
 * AI 채팅 관련 상수
 *
 * 모든 AI 채팅 관련 매직 넘버와 상수를 한 곳에서 관리
 */

import type { ChatMessage } from '@/lib/types/chat';

// =============================================================================
// 시스템 메시지
// =============================================================================

/**
 * AI 세션 자동 시작을 위한 시스템 메시지
 * 프론트엔드에서 세션 생성 시 자동으로 전송됨
 * 백엔드에서는 DB에 저장하지 않고 AI 대화 시작 트리거로만 사용
 */
export const AI_SYSTEM_MESSAGE = {
  /** 세션 시작 트리거 메시지 */
  START: '__START__',
} as const;

// =============================================================================
// 타이밍 상수 (밀리초)
// =============================================================================

export const AI_CHAT_TIMING = {
  /** 세션 시작 후 자동 메시지 전송 딜레이 (상태 안정화 대기) */
  AUTO_START_DELAY_MS: 50,

  /** 완료된 도구 상태 표시 유지 시간 */
  TOOL_COMPLETED_DISPLAY_MS: 2000,

  /** 에러 도구 상태 표시 유지 시간 (사용자 확인용) */
  TOOL_ERROR_DISPLAY_MS: 5000,
} as const;

// =============================================================================
// API 제한
// =============================================================================

export const AI_CHAT_LIMITS = {
  /** 단일 응답에서 최대 도구 호출 횟수 (무한 루프 방지) */
  MAX_TOOL_CALLS_PER_RESPONSE: 15,

  /** 메시지 최대 길이 */
  MAX_MESSAGE_LENGTH: 2000,

  /** 메시지 최소 길이 */
  MIN_MESSAGE_LENGTH: 1,
} as const;

// =============================================================================
// 초기 인사말
// =============================================================================

/**
 * 초기 인사말 (AI 응답 대기 중 표시)
 * 실제 질문은 AI가 request_user_input으로 처리
 */
export const INITIAL_GREETINGS: Record<'workout' | 'meal', string> = {
  workout: '안녕하세요! 맞춤 운동 루틴을 만들어 드릴게요.',
  meal: '안녕하세요! 맞춤 식단을 만들어 드릴게요.',
};

/**
 * 초기 인사 메시지 생성
 */
export function createInitialGreetingMessage(
  sessionId: string,
  purpose: 'workout' | 'meal'
): ChatMessage {
  return {
    id: `initial-greeting-${Date.now()}`,
    conversationId: sessionId,
    senderId: undefined,
    role: 'assistant',
    content: INITIAL_GREETINGS[purpose],
    contentType: 'text',
    createdAt: new Date().toISOString(),
  };
}

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 시스템 메시지인지 확인
 * @param message - 확인할 메시지
 * @returns 시스템 메시지 여부
 */
export function isSystemMessage(message: string): boolean {
  return message === AI_SYSTEM_MESSAGE.START;
}
