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
export type ConversationStatus = 'active' | 'completed';
export type ParticipantRole = 'owner' | 'admin' | 'member';
export type MessageRole = 'user' | 'assistant' | 'system';
export type ContentType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'location' | 'call' | 'tool_call' | 'tool_result';

// SessionPurpose는 routine.ts에서 가져오기 (호환성)
export type { SessionPurpose } from './routine';

// ============================================================================
// Database Types (snake_case - DB 직접 사용용)
// ============================================================================

/**
 * DB conversations 테이블 Row 타입
 */
export interface DbConversation {
  id: string;
  type: ConversationType;
  ai_purpose: 'workout' | 'coach' | null;
  ai_status: ConversationStatus | null;
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
 */
export interface Conversation {
  id: string;
  type: ConversationType;
  aiPurpose?: 'workout' | 'coach';
  aiStatus?: ConversationStatus;
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
 */
export interface ConversationCreateData {
  type: ConversationType;
  aiPurpose?: 'workout' | 'coach';
  title?: string;
  /** direct/group 채팅 시 초대할 유저 ID 목록 */
  participantIds?: string[];
}

/**
 * 대화방 업데이트용 데이터
 */
export interface ConversationUpdateData {
  title?: string;
  aiStatus?: ConversationStatus;
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
 */
export function transformDbConversation(db: DbConversation): Conversation {
  return {
    id: db.id,
    type: db.type,
    aiPurpose: db.ai_purpose ?? undefined,
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
// AI Session 호환 타입 (기존 AISession과 호환)
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

/**
 * 적용된 식단 메타데이터
 */
export interface AppliedMealPlanMetadata {
  previewId: string;
  eventsCreated: number;
  startDate: string;
  appliedAt: string;
}

/**
 * AI 세션 메타데이터 (미리보기 상태 복구용)
 */
export interface AISessionMetadata {
  // 루틴 관련
  pending_preview?: import('./fitness').RoutinePreviewData;
  applied_routine?: AppliedRoutineMetadata;
  // 프로필 확인
  pending_profile_confirmation?: ProfileConfirmationRequest;
  // 선택형 입력 요청
  pending_input?: import('./fitness').InputRequest;
}

/**
 * AI 세션 호환 타입 (기존 코드와의 호환성을 위해)
 * Conversation을 AISession처럼 사용할 수 있도록 변환
 */
export interface AISessionCompat {
  id: string;
  userId: string;
  purpose: 'workout' | 'coach';
  status: ConversationStatus;
  title?: string;
  messages: ChatMessage[];
  resultApplied: boolean;
  resultAppliedAt?: string;
  createdAt: string;
  completedAt?: string;
  /** 세션 메타데이터 (미리보기 상태 등) */
  metadata?: AISessionMetadata;
}

/**
 * Conversation + messages → AISessionCompat 변환
 */
export function toAISessionCompat(
  conversation: Conversation,
  messages: ChatMessage[]
): AISessionCompat {
  return {
    id: conversation.id,
    userId: conversation.createdBy,
    purpose: conversation.aiPurpose!,
    status: conversation.aiStatus ?? 'active',
    title: conversation.title,
    messages,
    resultApplied: conversation.aiResultApplied,
    resultAppliedAt: conversation.aiResultAppliedAt,
    createdAt: conversation.createdAt,
    completedAt: conversation.aiStatus === 'completed' ? conversation.updatedAt : undefined,
    metadata: conversation.metadata as AISessionMetadata | undefined,
  };
}

// ============================================================================
// Legacy ChatMessage 호환 (routine.ts의 ChatMessage와 호환)
// ============================================================================

/**
 * 기존 ChatMessage 형식으로 변환 (간단한 형태)
 */
export function toLegacyChatMessage(msg: ChatMessage): {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
} {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  };
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
