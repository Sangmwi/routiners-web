import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { DbRoutineEvent, transformDbEventToEvent } from '@/lib/types/routine';

/**
 * GET /api/routine/events/by-date
 * 특정 날짜의 이벤트 조회
 */
export const GET = withAuth(async (request: NextRequest, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const type = searchParams.get('type');

  if (!date) {
    return NextResponse.json(
      { error: 'date 파라미터가 필요합니다.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  let query = supabase
    .from('routine_events')
    .select('*')
    .eq('date', date);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(null, { status: 404 });
    }
    console.error('[Routine Events by-date GET] Error:', error);
    return NextResponse.json(
      { error: '이벤트를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const event = transformDbEventToEvent(data as DbRoutineEvent);
  return NextResponse.json(event);
});
