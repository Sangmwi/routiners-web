import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbRoutineEvent, transformDbEventToEvent } from '@/lib/types/routine';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/routine/events/[id]/skip
 * 이벤트 건너뛰기 처리
 */
export const POST = withAuth(async (request: NextRequest, { userId, supabase }) => {
  const { id } = await (request as unknown as RouteParams).params;

  const { data, error } = await supabase
    .from('routine_events')
    .update({
      status: 'skipped',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: '건너뛸 수 있는 이벤트를 찾을 수 없습니다.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('[Routine Event Skip] Error:', error);
    return NextResponse.json(
      { error: '이벤트 건너뛰기 처리에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const event = transformDbEventToEvent(data as DbRoutineEvent);
  return NextResponse.json(event);
});
