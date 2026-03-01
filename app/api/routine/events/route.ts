import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbRoutineEvent,
  toRoutineEvent,
  transformEventToDbInsert,
} from '@/lib/types/routine';
import { RoutineEventCreateSchema } from '@/lib/schemas/routine.schema';
import { conflict, internalError, validateRequest } from '@/lib/utils/apiResponse';

/**
 * GET /api/routine/events
 * 루틴 이벤트 목록 조회
 */
export const GET = withAuth(async (request: NextRequest, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let query = supabase
    .from('routine_events')
    .select('*')
    .order('date', { ascending: true })
    .range(offset, offset + limit - 1);

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }
  if (type) {
    query = query.eq('type', type);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Routine Events GET] Error:', error);
    return internalError('이벤트 목록을 불러오는데 실패했습니다.');
  }

  const events = (data as DbRoutineEvent[]).map(toRoutineEvent);
  return NextResponse.json(events);
});

/**
 * POST /api/routine/events
 * 루틴 이벤트 생성 (단일)
 */
export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  const result = await validateRequest(request, RoutineEventCreateSchema);
  if (!result.success) return result.response;

  const insertData = transformEventToDbInsert(result.data);

  const { data, error } = await supabase
    .from('routine_events')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('[Routine Events POST] Error:', error);

    // 중복 날짜 체크
    if (error.code === '23505') {
      return conflict('해당 날짜에 이미 루틴이 존재합니다.');
    }

    return internalError('이벤트 생성에 실패했습니다.');
  }

  const event = toRoutineEvent(data as DbRoutineEvent);
  return NextResponse.json(event, { status: 201 });
});
