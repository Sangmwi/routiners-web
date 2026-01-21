import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbRoutineEvent,
  transformDbEventToEvent,
  transformEventToCalendarSummary,
} from '@/lib/types/routine';

/**
 * GET /api/routine/events/calendar
 * 월별 캘린더 요약 조회
 */
export const GET = withAuth(async (request: NextRequest, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');

  if (!yearParam || !monthParam) {
    return NextResponse.json(
      { error: 'year와 month 파라미터가 필요합니다.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  const year = parseInt(yearParam, 10);
  const month = parseInt(monthParam, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: '유효하지 않은 year 또는 month입니다.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  // 해당 월의 시작일과 종료일 계산
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('routine_events')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('[Routine Events Calendar] Error:', error);
    return NextResponse.json(
      { error: '캘린더 데이터를 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  const events = (data as DbRoutineEvent[])
    .map(transformDbEventToEvent)
    .map(transformEventToCalendarSummary);

  return NextResponse.json(events);
});
