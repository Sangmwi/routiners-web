/**
 * Message Builder - OpenAI Responses API 입력 구성
 *
 * Phase 17: route.ts SOLID 리팩토링
 * - SRP: DB 메시지 → OpenAI input 변환만 담당
 * - Phase 16.5: summarized_until 필터링 포함
 */

import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbChatMessage } from '@/lib/types/chat';

// =============================================================================
// Types
// =============================================================================

export interface MessageQueryOptions {
  conversationId: string;
  summarizedUntil?: string | null;
}

// =============================================================================
// Message Fetching
// =============================================================================

/**
 * Phase 16.5: summarized_until 이후 메시지만 조회
 */
export async function fetchMessagesForAI(
  supabase: SupabaseClient,
  options: MessageQueryOptions
): Promise<DbChatMessage[]> {
  const { conversationId, summarizedUntil } = options;

  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null);

  // 요약이 있으면 요약 이후 메시지만 조회
  if (summarizedUntil) {
    const { data: lastSummarized } = await supabase
      .from('chat_messages')
      .select('created_at')
      .eq('id', summarizedUntil)
      .single();

    if (lastSummarized) {
      query = query.gt('created_at', lastSummarized.created_at);
    }
  }

  const { data } = await query.order('created_at', { ascending: true });
  return (data as DbChatMessage[]) || [];
}

// =============================================================================
// Input Building
// =============================================================================

/**
 * DB 메시지를 Responses API input 형식으로 변환
 *
 * Phase 21 fix: 요약 후 orphaned tool_result 방지
 * - tool_call의 call_id를 먼저 수집
 * - 대응되는 tool_result만 포함 (orphaned 제외)
 */
export function buildConversationInput(
  existingMessages: DbChatMessage[],
  newMessage: string
): OpenAI.Responses.ResponseInputItem[] {
  const input: OpenAI.Responses.ResponseInputItem[] = [];

  // Phase 21: 먼저 모든 tool_call의 call_id 수집
  const validCallIds = new Set<string>();
  for (const m of existingMessages) {
    if (m.content_type === 'tool_call' && m.metadata?.tool_calls) {
      const toolCalls = m.metadata.tool_calls as Array<{
        id: string;
        call_id?: string;
      }>;
      for (const tc of toolCalls) {
        validCallIds.add(tc.call_id || tc.id);
      }
    }
  }

  for (const m of existingMessages) {
    if (m.content_type === 'tool_call' && m.metadata?.tool_calls) {
      // Function call 출력 (이전 AI 응답)
      const toolCalls = m.metadata.tool_calls as Array<{
        id: string;
        name: string;
        arguments: string;
        call_id?: string;
      }>;
      for (const tc of toolCalls) {
        input.push({
          type: 'function_call',
          id: tc.id,
          call_id: tc.call_id || tc.id,
          name: tc.name,
          arguments: tc.arguments,
        });
      }
    } else if (m.content_type === 'tool_result' && m.metadata?.tool_call_id) {
      const callId = m.metadata.tool_call_id as string;

      // Phase 21: 대응되는 tool_call이 있는 경우만 function_call_output으로 포함
      if (validCallIds.has(callId)) {
        input.push({
          type: 'function_call_output',
          call_id: callId,
          output: m.content,
        });
      } else {
        // Orphaned tool_result: 맥락 유지를 위해 user 메시지로 변환
        // (요약으로 tool_call이 잘렸지만, 결과는 AI가 알아야 함)
        const toolName = m.metadata?.tool_name as string | undefined;
        const contextPrefix = toolName
          ? `[이전 ${toolName} 결과]`
          : '[이전 도구 결과]';

        input.push({
          type: 'message',
          role: 'user',
          content: `${contextPrefix} ${m.content}`,
        });

        console.info('[MessageBuilder] Converted orphaned tool_result to context:', {
          callId,
          toolName,
        });
      }
    } else if (m.role === 'user') {
      input.push({
        type: 'message',
        role: 'user',
        content: m.content,
      });
    } else if (m.role === 'assistant' && m.content_type === 'text' && m.content) {
      input.push({
        type: 'message',
        role: 'assistant',
        content: m.content,
      });
    }
  }

  // 새 사용자 메시지 추가
  input.push({
    type: 'message',
    role: 'user',
    content: newMessage,
  });

  return input;
}
