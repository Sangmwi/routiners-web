/**
 * Event Factory
 *
 * Routine/Meal 이벤트 생성의 공통 로직
 * - 이벤트 삽입 및 충돌 처리
 * - 대화 상태 업데이트
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { EventType } from '@/lib/types/routine';

// ============================================================================
// Types
// ============================================================================

export interface EventInsertContext {
  userId: string;
  supabase: SupabaseClient;
  conversationId: string;
}

export interface EventInsertData {
  user_id: string;
  type: EventType;
  date: string;
  title: string;
  data: unknown;
  rationale: string | null;
  status: 'scheduled';
  source: 'ai';
  ai_session_id: string;
}

export type ConflictStrategy = 'error' | 'overwrite';

export interface InsertEventsResult {
  success: boolean;
  eventsCreated?: number;
  startDate?: string;
  error?: string;
}

// ============================================================================
// Event Insertion
// ============================================================================

/**
 * 이벤트 삽입 (충돌 처리 전략 적용)
 *
 * @param ctx - 실행 컨텍스트
 * @param events - 삽입할 이벤트 목록
 * @param eventType - 이벤트 타입 ('workout' | 'meal')
 * @param conflictStrategy - 충돌 처리 전략 ('error' | 'overwrite')
 */
export async function insertEventsWithConflictCheck(
  ctx: EventInsertContext,
  events: EventInsertData[],
  eventType: EventType,
  conflictStrategy: ConflictStrategy
): Promise<InsertEventsResult> {
  if (events.length === 0) {
    return { success: false, error: '이벤트 데이터가 비어있습니다.' };
  }

  const dates = events.map((e) => e.date);

  // 충돌 확인
  const { data: existingEvents } = await ctx.supabase
    .from('routine_events')
    .select('date, type, title')
    .eq('user_id', ctx.userId)
    .in('date', dates)
    .eq('type', eventType);

  if (existingEvents && existingEvents.length > 0) {
    if (conflictStrategy === 'error') {
      const conflictDates = existingEvents.map((e) => e.date).slice(0, 3);
      const suffix = existingEvents.length > 3 ? ` 외 ${existingEvents.length - 3}개` : '';
      return {
        success: false,
        error: `일부 날짜에 이미 ${eventType === 'workout' ? '루틴' : '식단'}이 존재합니다: ${conflictDates.join(', ')}${suffix}. 기존 ${eventType === 'workout' ? '루틴' : '식단'}을 삭제 후 다시 시도해주세요.`,
      };
    }

    // overwrite: 해당 날짜의 기존 이벤트 삭제 (unique constraint 충돌 방지)
    const { error: deleteError } = await ctx.supabase
      .from('routine_events')
      .delete()
      .eq('user_id', ctx.userId)
      .in('date', dates)
      .eq('type', eventType);

    if (deleteError) {
      console.error(`[insertEvents:${eventType}] Delete error:`, deleteError);
      return { success: false, error: `기존 ${eventType === 'workout' ? '루틴' : '식단'} 삭제에 실패했습니다.` };
    }
  }

  // 이벤트 삽입
  const { error: insertError } = await ctx.supabase
    .from('routine_events')
    .insert(events);

  if (insertError) {
    console.error(`[insertEvents:${eventType}] Insert error:`, insertError);
    return { success: false, error: `${eventType === 'workout' ? '루틴' : '식단'} 저장에 실패했습니다.` };
  }

  return {
    success: true,
    eventsCreated: events.length,
    startDate: events[0]?.date || '',
  };
}

// ============================================================================
// Conversation Update
// ============================================================================

/**
 * 대화 상태를 적용 완료로 업데이트
 *
 * @param supabase - Supabase 클라이언트
 * @param conversationId - 대화 ID
 * @returns 에러 발생 시 에러 객체
 */
export async function updateConversationApplied(
  supabase: SupabaseClient,
  conversationId: string
): Promise<{ error?: Error }> {
  const { error } = await supabase
    .from('conversations')
    .update({
      ai_result_applied: true,
      ai_result_applied_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (error) {
    console.error('[updateConversationApplied] Error:', error);
    return { error: new Error(error.message) };
  }

  return {};
}
