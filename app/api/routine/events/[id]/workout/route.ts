import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbRoutineEvent, transformDbEventToEvent } from '@/lib/types/routine';
import { WorkoutDataSchema } from '@/lib/schemas/routine.schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/routine/events/[id]/workout
 * 워크아웃 데이터 업데이트 (실제 수행 기록)
 */
export const PATCH = withAuth(async (request: NextRequest, { userId, supabase }) => {
  const { id } = await (request as unknown as RouteParams).params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청 형식입니다.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  // data 필드 검증
  if (!body.data) {
    return NextResponse.json(
      { error: 'data 필드가 필요합니다.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  const validation = WorkoutDataSchema.safeParse(body.data);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: '워크아웃 데이터가 유효하지 않습니다.',
        code: 'VALIDATION_ERROR',
        details: validation.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('routine_events')
    .update({ data: validation.data })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: '이벤트를 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('[Routine Event Workout PATCH] Error:', error);
    return NextResponse.json(
      { error: '워크아웃 데이터 수정에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const event = transformDbEventToEvent(data as DbRoutineEvent);
  return NextResponse.json(event);
});
