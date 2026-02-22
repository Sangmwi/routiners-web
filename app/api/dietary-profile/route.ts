import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbDietaryProfile,
  DietaryProfileUpdateSchema,
  transformDbDietaryProfile,
  transformDietaryProfileToDb,
} from '@/lib/types/meal';
import { validateRequest, handleSupabaseError, badRequest } from '@/lib/utils/apiResponse';

/**
 * GET /api/dietary-profile
 * 현재 사용자의 식단 프로필 조회
 */
export const GET = withAuth(async (_request: NextRequest, { supabase }) => {
  const { data, error } = await supabase
    .from('dietary_profiles')
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(null);
    }

    console.error('[Dietary Profile GET] Error:', error);
    return NextResponse.json(
      { error: '식단 프로필을 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json(transformDbDietaryProfile(data as DbDietaryProfile));
});

/**
 * PUT /api/dietary-profile
 * 식단 프로필 생성 또는 업데이트 (Upsert)
 */
export const PUT = withAuth(async (request: NextRequest, { supabase }) => {
  const result = await validateRequest(request, DietaryProfileUpdateSchema);
  if (!result.success) return result.response;

  const updateData = transformDietaryProfileToDb(result.data);

  if (Object.keys(updateData).length === 0) {
    return badRequest('업데이트할 내용이 없습니다');
  }

  const { data, error } = await supabase
    .from('dietary_profiles')
    .upsert(updateData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[Dietary Profile PUT] Error:', error);
    return handleSupabaseError(error);
  }

  return NextResponse.json(transformDbDietaryProfile(data as DbDietaryProfile));
});
