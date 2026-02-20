import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbRoutineEvent,
  toRoutineEvent,
  transformEventToDbInsert,
} from '@/lib/types/routine';
import { MealBatchCreateSchema } from '@/lib/schemas/routine.schema';
import { simulateDelay } from '@/lib/utils/simulateDelay';

/**
 * POST /api/routine/events/batch-meal
 * 식단 이벤트 일괄 생성 (부대 식단 불러오기용)
 *
 * 기존 /events/batch와 달리 aiSessionId가 불필요하며,
 * 충돌 시 409 대신 해당 날짜를 스킵하고 나머지만 생성
 */
export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청 형식입니다.', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  const validation = MealBatchCreateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: '입력값이 유효하지 않습니다.',
        code: 'VALIDATION_ERROR',
        details: validation.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { events } = validation.data;
  const dates = events.map((e) => e.date);

  // 기존 식단 이벤트 조회 (충돌 날짜 파악)
  const { data: existing } = await supabase
    .from('routine_events')
    .select('date')
    .in('date', dates)
    .eq('type', 'meal');

  const existingDates = new Set(existing?.map((e) => e.date) ?? []);
  const skipped = dates.filter((d) => existingDates.has(d));
  const toInsert = events.filter((e) => !existingDates.has(e.date));

  if (toInsert.length === 0) {
    return NextResponse.json({ created: [], skipped }, { status: 200 });
  }

  // MVP: 저장 시뮬레이션 지연
  await simulateDelay(300, 500);

  const insertData = toInsert.map(transformEventToDbInsert);

  const { data, error } = await supabase
    .from('routine_events')
    .insert(insertData)
    .select();

  if (error) {
    console.error('[Batch Meal] Error:', error);
    return NextResponse.json(
      { error: '식단 일괄 생성에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 },
    );
  }

  const createdEvents = (data as DbRoutineEvent[]).map(toRoutineEvent);
  return NextResponse.json(
    { created: createdEvents, skipped },
    { status: 201 },
  );
});
