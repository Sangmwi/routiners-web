/**
 * Counselor System Types
 *
 * 범용 상담 AI 시스템 타입 정의
 * - 활성 목적(Active Purpose) 메타데이터
 * - 컨텍스트 요약 상태
 * - 액션 칩
 * - 확장된 대화 타입
 */

import type { RoutinePreviewData } from './fitness';
import type { ChatMessage, Conversation, AppliedRoutineMetadata } from './chat';

// ============================================================================
// Active Purpose Types
// ============================================================================

/**
 * 활성 목적 타입 (구조화된 프로세스)
 * 추후 확장 가능하도록 설계
 */
export type ActivePurposeType = 'routine_generation' | 'routine_modification' | 'quick_routine' | 'meal_plan_generation';

/**
 * 루틴 생성 프로세스 단계
 */
export type RoutineGenerationStage =
  | 'init'
  | 'collecting_info'
  | 'generating'
  | 'reviewing'
  | 'applying';

/**
 * 간단한 프로세스 단계 (routine_modification, quick_routine용)
 */
export type SimpleProcessStage = 'init' | 'generating' | 'reviewing';

/**
 * 모든 프로세스 단계 유니온
 */
export type ProcessStage = RoutineGenerationStage | SimpleProcessStage;

/**
 * 활성 목적 정보
 * 구조화된 프로세스가 진행 중일 때만 설정됨
 */
export interface ActivePurpose {
  /** 목적 타입 */
  type: ActivePurposeType;
  /** 현재 단계 */
  stage: ProcessStage;
  /** 수집된 데이터 (단계별로 누적) */
  collectedData: Record<string, unknown>;
  /** 시작 시간 */
  startedAt: string;
}

// ============================================================================
// Context Summarization Types
// ============================================================================

/**
 * 요약 상태 (UI 표시용)
 */
export interface SummarizationState {
  /** 요약 진행 중 여부 */
  isSummarizing: boolean;
  /** 진행률 (0-100, 선택사항) */
  progress?: number;
  /** 상태 메시지 */
  message?: string;
}

// ============================================================================
// Action Chip Types
// ============================================================================

/**
 * 액션 칩 컨텍스트 (표시 조건 판단용)
 */
export interface ActionChipContext {
  /** 활성 목적 존재 여부 */
  hasActivePurpose: boolean;
  /** 메시지 개수 */
  messageCount: number;
  /** 사용자 프로필 (선택사항) */
  userProfile?: {
    fitnessGoal?: string;
    experienceLevel?: string;
  };
}

/**
 * 액션 칩 정의
 */
export interface ActionChipDefinition {
  /** 고유 ID */
  id: string;
  /** 아이콘 이름 (Phosphor icon) */
  icon: string;
  /** 표시 라벨 */
  label: string;
  /** 설명 */
  description: string;
  /** 트리거할 활성 목적 타입 (있으면 프로세스 시작) */
  triggersPurpose?: ActivePurposeType;
  /** 즉시 실행 액션 (라우팅 등) */
  action?: string;
  /** AI에게 보낼 트리거 메시지 (프로세스 없이 AI가 상태 확인 후 라우팅) */
  triggerMessage?: string;
  /** 표시 조건 */
  enabled: (context: ActionChipContext) => boolean;
}

/**
 * 클라이언트용 액션 칩 (함수 제외)
 */
export interface ActionChip {
  id: string;
  icon: string;
  label: string;
  description: string;
  triggersPurpose?: ActivePurposeType;
  action?: string;
  triggerMessage?: string;
}

// ============================================================================
// Counselor Conversation Metadata
// ============================================================================

/**
 * 상담 대화 메타데이터
 * conversations.metadata 컬럼에 저장
 */
export interface CounselorConversationMetadata {
  /** 활성 목적 (구조화된 프로세스 진행 중일 때만) */
  activePurpose?: ActivePurpose | null;
  /** 대기 중인 루틴 미리보기 */
  pending_preview?: RoutinePreviewData;
  /** 적용된 루틴 정보 */
  applied_routine?: AppliedRoutineMetadata;
  /** 선택형 입력 요청 (UI 표시용) */
  pending_input?: {
    id: string;
    type: 'radio' | 'checkbox' | 'slider';
    message?: string;
    options?: Array<{ value: string; label: string }>;
  };
  /** 메시지 카운트 (요약 트리거용) */
  messageCount?: number;
}

// ============================================================================
// Extended Database Types
// ============================================================================

/**
 * 상담 시스템용 확장 DB Conversation 타입
 *
 * Phase 18: ai_purpose, ai_status 컬럼 제거됨
 */
export interface DbCounselorConversation {
  id: string;
  type: 'ai';
  ai_result_applied: boolean;
  ai_result_applied_at: string | null;
  title: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: CounselorConversationMetadata | null;
  /** 이전 대화 요약 */
  context_summary: string | null;
  /** 요약에 포함된 마지막 메시지 ID */
  summarized_until: string | null;
}

// ============================================================================
// Extended Domain Types
// ============================================================================

/**
 * 상담 시스템용 확장 대화 타입
 *
 * Phase 18: aiPurpose, aiStatus 제거 (레거시)
 * - 상담 시스템에서만 사용되므로 purpose 구분 불필요
 * - 범용 대화로 완료 개념 없음
 */
export interface CounselorConversation extends Omit<Conversation, 'metadata'> {
  /** 상담 메타데이터 */
  metadata?: CounselorConversationMetadata;
  /** 컨텍스트 요약 */
  contextSummary?: string;
  /** 요약 기준 메시지 ID */
  summarizedUntil?: string;
}

/**
 * 상담 대화 목록 아이템
 */
export interface CounselorConversationListItem {
  conversation: CounselorConversation;
  lastMessage?: ChatMessage;
  /** 활성 목적 존재 여부 (빠른 표시용) */
  hasActivePurpose: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * 메시지 페이지 응답 (무한스크롤용)
 */
export interface CounselorMessagePage {
  messages: ChatMessage[];
  /** 대화 정보 (메타데이터 포함) */
  conversation?: CounselorConversation;
  /** 다음 페이지 존재 여부 */
  hasMore: boolean;
  /** 다음 페이지 커서 */
  nextCursor?: string;
}

/**
 * 대화 목록 응답
 */
export interface CounselorConversationsResponse {
  conversations: CounselorConversationListItem[];
  /** 활성 대화 ID (있으면) */
  activeConversationId?: string;
}

// ============================================================================
// Create/Update Types
// ============================================================================

/**
 * 상담 대화 생성 데이터
 */
export interface CreateCounselorConversationData {
  /** 초기 활성 목적 (선택사항) */
  activePurpose?: ActivePurpose;
}

/**
 * 활성 목적 업데이트 데이터
 */
export interface UpdateActivePurposeData {
  activePurpose: ActivePurpose | null;
}

// ============================================================================
// Type Transformers
// ============================================================================

/**
 * DbCounselorConversation → CounselorConversation 변환
 *
 * Phase 18: ai_purpose, ai_status 변환 제거 (레거시)
 */
export function transformDbCounselorConversation(db: DbCounselorConversation): CounselorConversation {
  return {
    id: db.id,
    type: db.type,
    aiResultApplied: db.ai_result_applied,
    aiResultAppliedAt: db.ai_result_applied_at ?? undefined,
    title: db.title ?? undefined,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    metadata: db.metadata ?? undefined,
    contextSummary: db.context_summary ?? undefined,
    summarizedUntil: db.summarized_until ?? undefined,
  };
}

/**
 * CounselorConversation → DB Update 데이터 변환 (partial)
 *
 * Phase 18: aiStatus 제거 (레거시)
 */
export function transformCounselorConversationToDb(
  data: Partial<Pick<CounselorConversation, 'metadata' | 'contextSummary' | 'summarizedUntil' | 'title'>>
): Partial<Pick<DbCounselorConversation, 'metadata' | 'context_summary' | 'summarized_until' | 'title'>> {
  const result: Partial<Pick<DbCounselorConversation, 'metadata' | 'context_summary' | 'summarized_until' | 'title'>> = {};

  if (data.metadata !== undefined) result.metadata = data.metadata;
  if (data.contextSummary !== undefined) result.context_summary = data.contextSummary;
  if (data.summarizedUntil !== undefined) result.summarized_until = data.summarizedUntil;
  if (data.title !== undefined) result.title = data.title;

  return result;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 요약 트리거 조건 확인
 */
export function shouldTriggerSummarization(
  messageCount: number,
  summarizedUntil: string | undefined,
  threshold: number = 15
): boolean {
  // 요약된 적이 없고 메시지가 threshold 이상이면 트리거
  if (!summarizedUntil && messageCount >= threshold) return true;
  // 이미 요약된 적이 있으면 threshold 배수마다 트리거
  if (summarizedUntil && messageCount % threshold === 0) return true;
  return false;
}
