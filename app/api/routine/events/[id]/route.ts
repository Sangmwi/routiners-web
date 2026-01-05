import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbRoutineEvent, transformDbEventToEvent } from '@/lib/types/routine';
import { RoutineEventUpdateSchema } from '@/lib/schemas/routine.schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/routine/events/[id]
 * 특정 이벤트 상세 조회
 */
export const GET = withAuth(async (request: NextRequest, { userId, supabase }) => {
  const { id } = await (request as unknown as RouteParams).params;

  const { data, error } = await supabase
    .from('routine_events')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: '이벤트를 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('[Routine Event GET] Error:', error);
    return NextResponse.json(
      { error: '이벤트를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const event = transformDbEventToEvent(data as DbRoutineEvent);
  return NextResponse.json(event);
});

/**
 * PATCH /api/routine/events/[id]
 * 이벤트 수정
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

  // 유효성 검사
  const validation = RoutineEventUpdateSchema.safeParse(body);
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

  const updateData: Record<string, unknown> = {};
  if (validation.data.title !== undefined) updateData.title = validation.data.title;
  if (validation.data.data !== undefined) updateData.data = validation.data.data;
  if (validation.data.status !== undefined) updateData.status = validation.data.status;

  const { data, error } = await supabase
    .from('routine_events')
    .update(updateData)
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
    console.error('[Routine Event PATCH] Error:', error);
    return NextResponse.json(
      { error: '이벤트 수정에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const event = transformDbEventToEvent(data as DbRoutineEvent);
  return NextResponse.json(event);
});

/**
 * DELETE /api/routine/events/[id]
 * 이벤트 삭제
 */
export const DELETE = withAuth(async (request: NextRequest, { userId, supabase }) => {
  const { id } = await (request as unknown as RouteParams).params;

  const { error } = await supabase
    .from('routine_events')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('[Routine Event DELETE] Error:', error);
    return NextResponse.json(
      { error: '이벤트 삭제에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
});
