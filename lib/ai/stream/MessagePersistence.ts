/**
 * Message Persistence - 메시지 DB 저장/조회
 *
 * Phase 17: route.ts SOLID 리팩토링
 * - SRP: 메시지 저장/조회만 담당
 * - Phase 16: savedUserMessage, AI 메시지 조회 포함
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// Types
// =============================================================================

export interface SavedUserMessage {
  id: string;
  content: string;
  contentType: string;
  createdAt: string;
}

export interface SavedAiMessage {
  id: string;
  content: string;
  contentType: string;
  createdAt: string;
  metadata?: Record<string, unknown>;  // Phase 21: 트랜지언트 UI 상태 포함
}

export interface ToolCallData {
  id: string;
  call_id: string;
  name: string;
  arguments: string;
}

// =============================================================================
// User Message
// =============================================================================

/**
 * 사용자 메시지 저장
 * Phase 16: complete 이벤트용 데이터 반환
 */
export async function saveUserMessage(
  supabase: SupabaseClient,
  conversationId: string,
  content: string
): Promise<SavedUserMessage | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content,
      content_type: 'text',
    })
    .select('id, content, content_type, created_at')
    .single();

  if (error) {
    console.error('[MessagePersistence] User Message Error:', error);
    return null;
  }

  return {
    id: data.id,
    content: data.content,
    contentType: data.content_type,
    createdAt: data.created_at,
  };
}

// =============================================================================
// AI Messages
// =============================================================================

/**
 * AI 텍스트 메시지 저장
 */
export async function saveAiTextMessage(
  supabase: SupabaseClient,
  conversationId: string,
  content: string
): Promise<void> {
  await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_id: null,
    role: 'assistant',
    content,
    content_type: 'text',
  });
}

/**
 * AI 인사말 저장 (__START__ 메시지용)
 */
export async function saveGreetingMessage(
  supabase: SupabaseClient,
  conversationId: string,
  hasProcess: boolean
): Promise<void> {
  const greeting = hasProcess
    ? '안녕하세요! 맞춤 운동 루틴을 만들어 드릴게요.'
    : '안녕하세요! 무엇을 도와드릴까요? 운동, 영양, 건강 등 궁금한 점이 있으면 말씀해주세요.';

  await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_id: null,
    role: 'assistant',
    content: greeting,
    content_type: 'text',
  });
}

/**
 * Tool call 메시지 저장
 */
export async function saveToolCallMessage(
  supabase: SupabaseClient,
  conversationId: string,
  toolCalls: ToolCallData[]
): Promise<void> {
  await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_id: null,
    role: 'assistant',
    content: '',
    content_type: 'tool_call',
    metadata: { tool_calls: toolCalls },
  });
}

/**
 * Tool result 메시지 저장
 */
export async function saveToolResultMessage(
  supabase: SupabaseClient,
  conversationId: string,
  callId: string,
  toolName: string,
  result: string
): Promise<void> {
  await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_id: null,
    role: 'assistant',
    content: result,
    content_type: 'tool_result',
    metadata: { tool_call_id: callId, tool_name: toolName },
  });
}

// =============================================================================
// Complete Event Data (Phase 16)
// =============================================================================

/**
 * Phase 16: complete 이벤트용 AI 메시지 조회
 * - tool handler가 저장한 메시지 포함
 */
export async function fetchAiMessagesForComplete(
  supabase: SupabaseClient,
  conversationId: string,
  afterCreatedAt: string
): Promise<SavedAiMessage[]> {
  // Phase 21: metadata 추가 (트랜지언트 UI 상태 포함)
  const { data } = await supabase
    .from('chat_messages')
    .select('id, content, content_type, created_at, metadata')
    .eq('conversation_id', conversationId)
    .eq('role', 'assistant')
    .gt('created_at', afterCreatedAt)
    .in('content_type', ['text', 'profile_confirmation', 'routine_preview', 'input_request'])
    .order('created_at', { ascending: true });

  if (!data) return [];

  return data.map((m) => ({
    id: m.id,
    content: m.content,
    contentType: m.content_type,
    createdAt: m.created_at,
    metadata: m.metadata as Record<string, unknown> | undefined,
  }));
}

// =============================================================================
// Conversation Update
// =============================================================================

/**
 * 대화 업데이트 시간 갱신
 */
export async function updateConversationTimestamp(
  supabase: SupabaseClient,
  conversationId: string
): Promise<void> {
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);
}
