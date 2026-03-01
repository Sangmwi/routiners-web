import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbRoutineEvent,
  toRoutineEvent,
  transformEventToDbInsert,
} from '@/lib/types/routine';
import { RoutineBatchCreateSchema } from '@/lib/schemas/routine.schema';
import { notFound, internalError, validateRequest } from '@/lib/utils/apiResponse';

/**
 * POST /api/routine/events/batch
 * 루틴 이벤트 일괄 생성 (AI 생성 4주치)
 */
export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  const result = await validateRequest(request, RoutineBatchCreateSchema);
  if (!result.success) return result.response;

  const { events, aiSessionId } = result.data;

  // AI 대화(conversation) 확인 (RLS가 자동으로 권한 필터링)
  // Phase 18: ai_status 컬럼 제거됨
  const { data: session, error: sessionError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', aiSessionId)
    .eq('type', 'ai')
    .single();

  if (sessionError || !session) {
    return notFound('AI 세션을 찾을 수 없습니다.');
  }

  // 이벤트 데이터 변환
  const insertData = events.map((event) => ({
    ...transformEventToDbInsert(event),
    ai_session_id: aiSessionId,
  }));

  // 기존 이벤트와 충돌 확인 (같은 날짜에 같은 타입, RLS가 자동 필터링)
  const dates = events.map((e) => e.date);
  const types = [...new Set(events.map((e) => e.type))];

  const { data: existingEvents } = await supabase
    .from('routine_events')
    .select('date, type')
    .in('date', dates)
    .in('type', types);

  if (existingEvents && existingEvents.length > 0) {
    const conflicts = existingEvents.map((e) => `${e.date} (${e.type})`);
    return NextResponse.json(
      {
        error: `일부 날짜에 이미 루틴이 존재합니다: ${conflicts.join(', ')}`,
        code: 'ALREADY_EXISTS',
        conflicts,
      },
      { status: 409 }
    );
  }

  // 일괄 삽입
  const { data, error } = await supabase
    .from('routine_events')
    .insert(insertData)
    .select();

  if (error) {
    console.error('[Routine Events Batch] Error:', error);
    return internalError('이벤트 생성에 실패했습니다.');
  }

  // AI 대화 업데이트 (ai_result_applied = true)
  await supabase
    .from('conversations')
    .update({
      ai_result_applied: true,
      ai_result_applied_at: new Date().toISOString(),
    })
    .eq('id', aiSessionId);

  const createdEvents = (data as DbRoutineEvent[]).map(toRoutineEvent);
  return NextResponse.json(createdEvents, { status: 201 });
});
