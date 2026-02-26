import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  toBig3Record,
  transformBig3ToDbInsert,
  type Big3CreateData,
  type DbBig3Record,
  type Big3LiftType,
} from '@/lib/types/big3';
import { parseRequestBody, handleSupabaseError, badRequest } from '@/lib/utils/apiResponse';

const VALID_LIFT_TYPES: Big3LiftType[] = ['squat', 'bench', 'deadlift'];
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * GET /api/big3
 * Big3 기록 목록 조회 (최신순, 페이지네이션)
 */
export const GET = withAuth(async (request: NextRequest, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
  const offset = (page - 1) * limit;
  const liftType = searchParams.get('liftType') as Big3LiftType | null;

  let query = supabase
    .from('big3_records')
    .select('*', { count: 'exact' })
    .order('recorded_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (liftType && VALID_LIFT_TYPES.includes(liftType)) {
    query = query.eq('lift_type', liftType);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[Big3 GET] Error:', error);
    return handleSupabaseError(error);
  }

  const total = count ?? 0;
  const records = (data as DbBig3Record[]).map(toBig3Record);
  return NextResponse.json({
    records,
    page,
    hasMore: offset + (data?.length ?? 0) < total,
  });
});

/**
 * POST /api/big3
 * 새 Big3 기록 생성 (수동 입력)
 */
export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  const result = await parseRequestBody<Big3CreateData>(request);
  if (!result.success) return result.response;
  const body = result.data;

  if (!body.recordedAt || !body.liftType || !body.weight) {
    return badRequest('필수 항목(기록일, 종목, 중량)을 입력해주세요');
  }

  if (!VALID_LIFT_TYPES.includes(body.liftType)) {
    return badRequest('유효하지 않은 종목입니다');
  }

  const insertData = transformBig3ToDbInsert(body);

  const { data, error } = await supabase
    .from('big3_records')
    .insert({ ...insertData, source: 'manual' })
    .select()
    .single();

  if (error) {
    console.error('[Big3 POST] Error:', error);
    return handleSupabaseError(error);
  }

  const record = toBig3Record(data as DbBig3Record);
  return NextResponse.json(record, { status: 201 });
});
