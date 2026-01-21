import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  transformDbInBodyToInBody,
  transformInBodyToDbInsert,
  InBodyCreateData,
  DbInBodyRecord,
} from '@/lib/types/inbody';
import { parseRequestBody, handleSupabaseError, badRequest } from '@/lib/utils/apiResponse';

/**
 * GET /api/inbody
 * InBody 기록 목록 조회 (최신순)
 */
export const GET = withAuth(async (request: NextRequest, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const { data, error } = await supabase
    .from('inbody_records')
    .select('*')
    .order('measured_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[InBody GET] Error:', error);
    return handleSupabaseError(error);
  }

  const records = (data as DbInBodyRecord[]).map(transformDbInBodyToInBody);
  return NextResponse.json(records);
});

/**
 * POST /api/inbody
 * 새 InBody 기록 생성
 */
export const POST = withAuth(async (request: NextRequest, { supabase }) => {
  const result = await parseRequestBody<InBodyCreateData>(request);
  if (!result.success) return result.response;
  const body = result.data;

  // 필수 필드 검증
  if (!body.measuredAt || !body.weight || !body.skeletalMuscleMass || body.bodyFatPercentage === undefined) {
    return badRequest('필수 항목(측정일, 체중, 골격근량, 체지방률)을 입력해주세요');
  }

  // DB 형식으로 변환
  const insertData = transformInBodyToDbInsert(body);

  const { data, error } = await supabase
    .from('inbody_records')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('[InBody POST] Error:', error);
    return handleSupabaseError(error);
  }

  const record = transformDbInBodyToInBody(data as DbInBodyRecord);
  return NextResponse.json(record, { status: 201 });
});
