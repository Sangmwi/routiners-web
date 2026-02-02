import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbRoutineEvent,
  toRoutineEvent,
  transformEventToDbInsert,
} from '@/lib/types/routine';
import { RoutineBatchCreateSchema } from '@/lib/schemas/routine.schema';

/**
 * POST /api/routine/events/batch
 * 루틴 이벤트 일괄 생성 (AI 생성 4주치)
 */
export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청 형식입니다.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  // 유효성 검사
  const validation = RoutineBatchCreateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: '입력값이 유효하지 않습니다.',
        code: 'VALIDATION_ERROR',
        details: validation.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { events, aiSessionId } = validation.data;

  // AI 대화(conversation) 확인 (RLS가 자동으로 권한 필터링)
  // Phase 18: ai_status 컬럼 제거됨
  const { data: session, error: sessionError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', aiSessionId)
    .eq('type', 'ai')
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'AI 세션을 찾을 수 없습니다.', code: 'NOT_FOUND' },
      { status: 404 }
    );
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
    return NextResponse.json(
      { error: '이벤트 생성에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
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
