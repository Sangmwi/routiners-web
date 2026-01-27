/**
 * Coach System Types
 *
 * 범용 코치 AI 시스템 타입 정의
 * - 활성 목적(Active Purpose) 메타데이터
 * - 컨텍스트 요약 상태
 * - 액션 칩
 * - 확장된 대화 타입
 */

import type { RoutinePreviewData } from './fitness';
import type { ChatMessage, Conversation, ConversationStatus, AppliedRoutineMetadata } from './chat';

// ============================================================================
// Active Purpose Types
// ============================================================================

/**
 * 활성 목적 타입 (구조화된 프로세스)
 * 추후 확장 가능하도록 설계
 */
export type ActivePurposeType = 'routine_generation';

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
 * 활성 목적 정보
 * 구조화된 프로세스가 진행 중일 때만 설정됨
 */
export interface ActivePurpose {
  /** 목적 타입 */
  type: ActivePurposeType;
  /** 현재 단계 */
  stage: RoutineGenerationStage;
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
}

// ============================================================================
// Coach Conversation Metadata
// ============================================================================

/**
 * 코치 대화 메타데이터
 * conversations.metadata 컬럼에 저장
 */
export interface CoachConversationMetadata {
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
 * 코치 시스템용 확장 DB Conversation 타입
 * 새로 추가된 컬럼 포함
 */
export interface DbCoachConversation {
  id: string;
  type: 'ai';
  ai_purpose: 'coach';
  ai_status: ConversationStatus | null;
  ai_result_applied: boolean;
  ai_result_applied_at: string | null;
  title: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: CoachConversationMetadata | null;
  /** 이전 대화 요약 */
  context_summary: string | null;
  /** 요약에 포함된 마지막 메시지 ID */
  summarized_until: string | null;
}

// ============================================================================
// Extended Domain Types
// ============================================================================

/**
 * 코치 시스템용 확장 대화 타입
 */
export interface CoachConversation extends Omit<Conversation, 'aiPurpose' | 'metadata'> {
  aiPurpose: 'coach';
  /** 코치 메타데이터 */
  metadata?: CoachConversationMetadata;
  /** 컨텍스트 요약 */
  contextSummary?: string;
  /** 요약 기준 메시지 ID */
  summarizedUntil?: string;
}

/**
 * 코치 대화 목록 아이템
 */
export interface CoachConversationListItem {
  conversation: CoachConversation;
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
export interface CoachMessagePage {
  messages: ChatMessage[];
  /** 대화 정보 (메타데이터 포함) */
  conversation?: CoachConversation;
  /** 다음 페이지 존재 여부 */
  hasMore: boolean;
  /** 다음 페이지 커서 */
  nextCursor?: string;
}

/**
 * 대화 목록 응답
 */
export interface CoachConversationsResponse {
  conversations: CoachConversationListItem[];
  /** 활성 대화 ID (있으면) */
  activeConversationId?: string;
}

// ============================================================================
// Create/Update Types
// ============================================================================

/**
 * 코치 대화 생성 데이터
 */
export interface CreateCoachConversationData {
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
 * DbCoachConversation → CoachConversation 변환
 */
export function transformDbCoachConversation(db: DbCoachConversation): CoachConversation {
  return {
    id: db.id,
    type: db.type,
    aiPurpose: db.ai_purpose,
    aiStatus: db.ai_status ?? undefined,
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
 * CoachConversation → DB Update 데이터 변환 (partial)
 */
export function transformCoachConversationToDb(
  data: Partial<Pick<CoachConversation, 'metadata' | 'contextSummary' | 'summarizedUntil' | 'title' | 'aiStatus'>>
): Partial<Pick<DbCoachConversation, 'metadata' | 'context_summary' | 'summarized_until' | 'title' | 'ai_status'>> {
  const result: Partial<Pick<DbCoachConversation, 'metadata' | 'context_summary' | 'summarized_until' | 'title' | 'ai_status'>> = {};

  if (data.metadata !== undefined) result.metadata = data.metadata;
  if (data.contextSummary !== undefined) result.context_summary = data.contextSummary;
  if (data.summarizedUntil !== undefined) result.summarized_until = data.summarizedUntil;
  if (data.title !== undefined) result.title = data.title;
  if (data.aiStatus !== undefined) result.ai_status = data.aiStatus;

  return result;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 활성 목적 타입에 따른 기본 프롬프트 가져오기
 */
export function getActivePurposePrompt(purpose: ActivePurpose): string {
  switch (purpose.type) {
    case 'routine_generation':
      return `현재 운동 루틴 생성 프로세스 진행 중입니다.
단계: ${purpose.stage}
수집된 정보: ${JSON.stringify(purpose.collectedData)}`;
    default:
      return '';
  }
}

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
