/**
 * Chat Types (새 스키마용)
 *
 * conversations, chat_messages, conversation_participants 테이블 기반
 * AI 채팅 + 유저 간 실시간 채팅 통합 지원
 */

// ============================================================================
// Enums & Constants
// ============================================================================

export type ConversationType = 'ai' | 'direct' | 'group';
// Phase 18: ConversationStatus 제거 (ai_status 컬럼 삭제됨)
export type ParticipantRole = 'owner' | 'admin' | 'member';
export type MessageRole = 'user' | 'assistant' | 'system';
export type ContentType =
  | 'text'
  | 'image'
  | 'file'
  | 'audio'
  | 'video'
  | 'location'
  | 'call'
  | 'tool_call'
  | 'tool_result'
  | 'system_log'
  // Transient UI types (메시지로 저장되어 영구 보존됨)
  | 'profile_confirmation'  // 프로필 확인 카드
  | 'routine_preview'       // 루틴 미리보기 카드
  | 'input_request';        // 선택형 입력 UI

// SessionPurpose는 routine.ts에서 가져오기 (호환성)
export type { SessionPurpose } from './routine';

// ============================================================================
// Database Types (snake_case - DB 직접 사용용)
// ============================================================================

/**
 * DB conversations 테이블 Row 타입
 *
 * Phase 18: ai_purpose, ai_status 컬럼 제거됨
 */
export interface DbConversation {
  id: string;
  type: ConversationType;
  ai_result_applied: boolean;
  ai_result_applied_at: string | null;
  title: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: Record<string, unknown> | null;
  /** AI-generated summary of previous conversation context */
  context_summary: string | null;
  /** Reference to the last message included in context_summary */
  summarized_until: string | null;
}

/**
 * DB conversation_participants 테이블 Row 타입
 */
export interface DbConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ParticipantRole;
  joined_at: string;
  left_at: string | null;
  last_read_at: string | null;
  last_read_message_id: string | null;
  muted: boolean;
  muted_until: string | null;
}

/**
 * DB chat_messages 테이블 Row 타입
 */
export interface DbChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  role: MessageRole;
  content: string;
  content_type: ContentType;
  media_url: string | null;
  media_metadata: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  reply_to_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

/**
 * DB message_reactions 테이블 Row 타입
 */
export interface DbMessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// ============================================================================
// Domain Types (camelCase - 클라이언트 사용용)
// ============================================================================

/**
 * 클라이언트용 대화방 타입
 *
 * Phase 18: ai_purpose, ai_status 레거시 필드 제거
 * - AI 대화는 항상 coach 용도 (ai_purpose 불필요)
 * - 범용 대화로 완료 개념 없음 (ai_status 불필요)
 */
export interface Conversation {
  id: string;
  type: ConversationType;
  aiResultApplied: boolean;
  aiResultAppliedAt?: string;
  title?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** 대화방 메타데이터 (미리보기 상태 등) */
  metadata?: Record<string, unknown>;
  /** AI-generated context summary */
  contextSummary?: string;
  /** Last message ID included in summary */
  summarizedUntil?: string;

  // 조인 데이터 (optional)
  participants?: ConversationParticipant[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

/**
 * 클라이언트용 참여자 타입
 */
export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: ParticipantRole;
  joinedAt: string;
  leftAt?: string;
  lastReadAt?: string;
  lastReadMessageId?: string;
  muted: boolean;
  mutedUntil?: string;
}

/**
 * 클라이언트용 채팅 메시지 타입
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId?: string;
  role: MessageRole;
  content: string;
  contentType: ContentType;
  mediaUrl?: string;
  mediaMetadata?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  replyToId?: string;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;

  // 조인 데이터 (optional)
  sender?: {
    id: string;
    realName: string;
    profileImageUrl?: string;
  };
  reactions?: MessageReaction[];
  replyTo?: ChatMessage;
}

/**
 * 클라이언트용 메시지 반응 타입
 */
export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

// ============================================================================
// Create/Update Types
// ============================================================================

/**
 * 대화방 생성용 데이터
 *
 * Phase 18: aiPurpose 제거 (AI 대화는 항상 coach)
 */
export interface ConversationCreateData {
  type: ConversationType;
  title?: string;
  /** direct/group 채팅 시 초대할 유저 ID 목록 */
  participantIds?: string[];
}

/**
 * 대화방 업데이트용 데이터
 *
 * Phase 18: aiStatus 제거 (완료 개념 없음)
 */
export interface ConversationUpdateData {
  title?: string;
  aiResultApplied?: boolean;
}

/**
 * 메시지 생성용 데이터
 */
export interface MessageCreateData {
  content: string;
  contentType?: ContentType;
  mediaUrl?: string;
  mediaMetadata?: Record<string, unknown>;
  replyToId?: string;
}

/**
 * 메시지 업데이트용 데이터
 */
export interface MessageUpdateData {
  content?: string;
}

// ============================================================================
// Type Transformers
// ============================================================================

/**
 * DbConversation → Conversation 변환
 *
 * Phase 18: ai_purpose, ai_status 변환 제거 (레거시)
 */
export function transformDbConversation(db: DbConversation): Conversation {
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
 * DbConversationParticipant → ConversationParticipant 변환
 */
export function transformDbParticipant(db: DbConversationParticipant): ConversationParticipant {
  return {
    id: db.id,
    conversationId: db.conversation_id,
    userId: db.user_id,
    role: db.role,
    joinedAt: db.joined_at,
    leftAt: db.left_at ?? undefined,
    lastReadAt: db.last_read_at ?? undefined,
    lastReadMessageId: db.last_read_message_id ?? undefined,
    muted: db.muted,
    mutedUntil: db.muted_until ?? undefined,
  };
}

/**
 * DbChatMessage → ChatMessage 변환
 */
export function transformDbMessage(db: DbChatMessage): ChatMessage {
  return {
    id: db.id,
    conversationId: db.conversation_id,
    senderId: db.sender_id ?? undefined,
    role: db.role,
    content: db.content,
    contentType: db.content_type,
    mediaUrl: db.media_url ?? undefined,
    mediaMetadata: db.media_metadata ?? undefined,
    metadata: db.metadata ?? undefined,
    replyToId: db.reply_to_id ?? undefined,
    createdAt: db.created_at,
    editedAt: db.edited_at ?? undefined,
    deletedAt: db.deleted_at ?? undefined,
  };
}

/**
 * DbMessageReaction → MessageReaction 변환
 */
export function transformDbReaction(db: DbMessageReaction): MessageReaction {
  return {
    id: db.id,
    messageId: db.message_id,
    userId: db.user_id,
    emoji: db.emoji,
    createdAt: db.created_at,
  };
}

// ============================================================================
// Metadata Types
// ============================================================================

/**
 * 적용된 루틴 메타데이터
 */
export interface AppliedRoutineMetadata {
  previewId: string;
  eventsCreated: number;
  startDate: string;
  appliedAt: string;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface MessagePage {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface ConversationListItem {
  conversation: Conversation;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

// ============================================================================
// Profile Confirmation Types (프로필 확인 UI)
// ============================================================================

/**
 * 프로필 확인 요청 필드
 */
export interface ProfileConfirmationField {
  /** 필드 키 (예: "fitnessGoal", "experienceLevel") */
  key: string;
  /** 표시 라벨 (예: "운동 목표", "운동 경험") */
  label: string;
  /** 저장된 값 (예: "muscle_gain", "beginner") */
  value: string;
  /** 표시용 값 - 한국어 (예: "근육 증가", "초보자") */
  displayValue: string;
}

/**
 * 프로필 확인 요청 데이터
 *
 * AI가 기존 프로필 데이터를 확인받을 때 사용
 */
export interface ProfileConfirmationRequest {
  /** 고유 ID */
  id: string;
  /** 확인 카드 제목 (예: "현재 설정된 운동 프로필") */
  title: string;
  /** 확인 안내 메시지 (예: "아래 정보가 맞는지 확인해주세요") */
  description?: string;
  /** 확인할 필드 목록 */
  fields: ProfileConfirmationField[];
  /** 확인 버튼 텍스트 (기본값: "확인") */
  confirmText?: string;
  /** 수정 버튼 텍스트 (기본값: "수정하기") */
  editText?: string;
}

// ============================================================================
// Transient UI Message Types (메시지 기반 트랜지언트 UI)
// ============================================================================

/**
 * 프로필 확인 메시지 상태
 * - pending: 대기 중 (버튼 표시)
 * - confirmed: 확인됨
 * - edited: 수정 요청됨
 * - cancelled: 종료됨
 */
export type ProfileConfirmationStatus = 'pending' | 'confirmed' | 'edited' | 'cancelled';

/**
 * 루틴 미리보기 메시지 상태
 * - pending: 대기 중 (버튼 표시)
 * - applied: 적용됨
 * - edited: 수정 요청됨
 * - cancelled: 종료됨
 */
export type RoutinePreviewStatus = 'pending' | 'applied' | 'edited' | 'cancelled';

/**
 * 입력 요청 메시지 상태
 */
export type InputRequestStatus = 'pending' | 'submitted' | 'cancelled';

/**
 * 트랜지언트 UI 메시지 메타데이터
 */
export interface TransientUIMessageMetadata {
  /** 현재 상태 */
  status: ProfileConfirmationStatus | RoutinePreviewStatus | InputRequestStatus;
  /** 상태 업데이트 시각 */
  updatedAt?: string;
  /** 제출된 값 (input_request인 경우) */
  submittedValue?: string;
}
