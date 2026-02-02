import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbFitnessProfile,
  FitnessProfileUpdateSchema,
  transformDbFitnessProfile,
  transformFitnessProfileToDb,
} from '@/lib/types/fitness';
import { validateRequest, handleSupabaseError, badRequest } from '@/lib/utils/apiResponse';

/**
 * GET /api/fitness-profile
 * 현재 사용자의 피트니스 프로필 조회
 */
export const GET = withAuth(async (_request: NextRequest, { supabase }) => {
  const { data, error } = await supabase
    .from('fitness_profiles')
    .select('*')
    .single();

  if (error) {
    // 프로필이 없는 경우 빈 프로필 반환
    if (error.code === 'PGRST116') {
      return NextResponse.json({
        userId: null,
        fitnessGoal: null,
        experienceLevel: null,
        preferredDaysPerWeek: null,
        sessionDurationMinutes: null,
        equipmentAccess: null,
        focusAreas: [],
        injuries: [],
        preferences: [],
        restrictions: [],
        aiNotes: {},
        createdAt: null,
        updatedAt: null,
      });
    }

    console.error('[Fitness Profile GET] Error:', error);
    return NextResponse.json(
      { error: '피트니스 프로필을 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json(transformDbFitnessProfile(data as DbFitnessProfile));
});

/**
 * PUT /api/fitness-profile
 * 피트니스 프로필 생성 또는 업데이트 (Upsert)
 */
export const PUT = withAuth(async (request: NextRequest, { supabase }) => {
  const result = await validateRequest(request, FitnessProfileUpdateSchema);
  if (!result.success) return result.response;

  const updateData = transformFitnessProfileToDb(result.data);

  // Upsert
  const { data, error } = await supabase
    .from('fitness_profiles')
    .upsert(updateData, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[Fitness Profile PUT] Error:', error);
    return handleSupabaseError(error);
  }

  return NextResponse.json(transformDbFitnessProfile(data as DbFitnessProfile));
});

/**
 * PATCH /api/fitness-profile
 * 피트니스 프로필 부분 업데이트
 */
export const PATCH = withAuth(async (request: NextRequest, { supabase }) => {
  const result = await validateRequest(request, FitnessProfileUpdateSchema);
  if (!result.success) return result.response;

  const updateData = transformFitnessProfileToDb(result.data);

  if (Object.keys(updateData).length === 0) {
    return badRequest('업데이트할 내용이 없습니다');
  }

  // 기존 프로필 확인
  const { data: existing } = await supabase
    .from('fitness_profiles')
    .select('user_id')
    .single();

  if (!existing) {
    // 프로필이 없으면 생성
    const { data, error } = await supabase
      .from('fitness_profiles')
      .insert(updateData)
      .select()
      .single();

    if (error) {
      console.error('[Fitness Profile PATCH] Insert Error:', error);
      return handleSupabaseError(error);
    }

    return NextResponse.json(transformDbFitnessProfile(data as DbFitnessProfile), { status: 201 });
  }

  // 프로필 업데이트
  const { data, error } = await supabase
    .from('fitness_profiles')
    .update(updateData)
    .eq('user_id', existing.user_id)
    .select()
    .single();

  if (error) {
    console.error('[Fitness Profile PATCH] Update Error:', error);
    return handleSupabaseError(error);
  }

  return NextResponse.json(transformDbFitnessProfile(data as DbFitnessProfile));
});

/**
 * DELETE /api/fitness-profile
 * 피트니스 프로필 삭제
 */
export const DELETE = withAuth(async (_request: NextRequest, { supabase }) => {
  const { error } = await supabase
    .from('fitness_profiles')
    .delete()
    .neq('user_id', '');

  if (error) {
    console.error('[Fitness Profile DELETE] Error:', error);
    return handleSupabaseError(error);
  }

  return NextResponse.json({ success: true });
});
