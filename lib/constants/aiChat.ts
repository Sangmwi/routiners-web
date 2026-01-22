/**
 * AI 채팅 관련 상수
 *
 * 모든 AI 채팅 관련 매직 넘버와 상수를 한 곳에서 관리
 * - SSE 이벤트 타입
 * - 진행률 단계
 * - 타이밍/제한 상수
 */

import type { ChatMessage } from '@/lib/types/chat';

// =============================================================================
// SSE 이벤트 타입
// =============================================================================

/**
 * 서버에서 클라이언트로 전송되는 SSE 이벤트 타입
 */
export const SSE_EVENT_TYPES = {
  // 스트리밍
  CONTENT: 'content',
  DONE: 'done',
  ERROR: 'error',

  // 도구 실행
  TOOL_START: 'tool_start',
  TOOL_DONE: 'tool_done',

  // 사용자 입력 요청
  INPUT_REQUEST: 'input_request',
  PROFILE_CONFIRMATION: 'profile_confirmation',

  // 루틴 관련
  ROUTINE_PROGRESS: 'routine_progress',
  ROUTINE_PREVIEW: 'routine_preview',
  ROUTINE_APPLIED: 'routine_applied',

  // 식단 관련
  MEAL_PLAN_PROGRESS: 'meal_plan_progress',
  MEAL_PLAN_PREVIEW: 'meal_plan_preview',
  MEAL_PLAN_APPLIED: 'meal_plan_applied',
} as const;

export type SSEEventType = (typeof SSE_EVENT_TYPES)[keyof typeof SSE_EVENT_TYPES];

// =============================================================================
// 진행률 표시 단계
// =============================================================================

/**
 * 진행률 단계 타입
 */
export interface ProgressStage {
  stage: string;
  progress: number;
  message: string;
}

/**
 * 루틴 생성 진행률 단계
 */
export const ROUTINE_PROGRESS_STAGES: ProgressStage[] = [
  { stage: 'analyzing', progress: 20, message: '운동 목표 분석 중...' },
  { stage: 'selecting', progress: 40, message: '운동 선택 중...' },
  { stage: 'structuring', progress: 60, message: '루틴 구성 중...' },
  { stage: 'optimizing', progress: 80, message: '최적화 중...' },
  { stage: 'finalizing', progress: 95, message: '마무리 중...' },
];

/**
 * 식단 생성 진행률 단계
 */
export const MEAL_PLAN_PROGRESS_STAGES: ProgressStage[] = [
  { stage: 'analyzing', progress: 20, message: '식단 요구사항 분석 중...' },
  { stage: 'calculating', progress: 40, message: '영양소 계산 중...' },
  { stage: 'generating', progress: 60, message: '식단 생성 중...' },
  { stage: 'optimizing', progress: 80, message: '최적화 중...' },
  { stage: 'finalizing', progress: 95, message: '마무리 중...' },
];

/**
 * 세션 목적별 진행률 단계
 */
export const PROGRESS_STAGES = {
  workout: ROUTINE_PROGRESS_STAGES,
  meal: MEAL_PLAN_PROGRESS_STAGES,
} as const;

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
// AI 모델 설정
// =============================================================================

export const AI_MODEL = {
  /** 기본 AI 모델 (채팅, InBody 스캔 등) */
  DEFAULT: 'gpt-5.1',
  /** 최대 토큰 수 */
  MAX_TOKENS: 4096,
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
