import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  DbFitnessProfile,
  FitnessProfileUpdateData,
  FitnessProfileUpdateSchema,
  transformDbFitnessProfile,
  transformFitnessProfileToDb,
} from '@/lib/types/fitness';

/**
 * GET /api/fitness-profile
 * 현재 사용자의 피트니스 프로필 조회
 */
export const GET = withAuth(async (request: NextRequest, { userId, supabase }) => {
  const { data, error } = await supabase
    .from('fitness_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // 프로필이 없는 경우 빈 프로필 반환
    if (error.code === 'PGRST116') {
      return NextResponse.json({
        userId,
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
export const PUT = withAuth(async (request: NextRequest, { userId, supabase }) => {
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
  const validation = FitnessProfileUpdateSchema.safeParse(body);
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

  const updateData = transformFitnessProfileToDb(validation.data);

  // Upsert
  const { data, error } = await supabase
    .from('fitness_profiles')
    .upsert(
      {
        user_id: userId,
        ...updateData,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[Fitness Profile PUT] Error:', error);
    return NextResponse.json(
      { error: '피트니스 프로필 저장에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json(transformDbFitnessProfile(data as DbFitnessProfile));
});

/**
 * PATCH /api/fitness-profile
 * 피트니스 프로필 부분 업데이트
 */
export const PATCH = withAuth(async (request: NextRequest, { userId, supabase }) => {
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
  const validation = FitnessProfileUpdateSchema.safeParse(body);
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

  const updateData = transformFitnessProfileToDb(validation.data);

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: '업데이트할 내용이 없습니다.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  // 기존 프로필 확인
  const { data: existing } = await supabase
    .from('fitness_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    // 프로필이 없으면 생성
    const { data, error } = await supabase
      .from('fitness_profiles')
      .insert({
        user_id: userId,
        ...updateData,
      })
      .select()
      .single();

    if (error) {
      console.error('[Fitness Profile PATCH] Insert Error:', error);
      return NextResponse.json(
        { error: '피트니스 프로필 생성에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(transformDbFitnessProfile(data as DbFitnessProfile), { status: 201 });
  }

  // 프로필 업데이트
  const { data, error } = await supabase
    .from('fitness_profiles')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[Fitness Profile PATCH] Update Error:', error);
    return NextResponse.json(
      { error: '피트니스 프로필 업데이트에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json(transformDbFitnessProfile(data as DbFitnessProfile));
});

/**
 * DELETE /api/fitness-profile
 * 피트니스 프로필 삭제
 */
export const DELETE = withAuth(async (request: NextRequest, { userId, supabase }) => {
  const { error } = await supabase
    .from('fitness_profiles')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('[Fitness Profile DELETE] Error:', error);
    return NextResponse.json(
      { error: '피트니스 프로필 삭제에 실패했습니다.', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
});
