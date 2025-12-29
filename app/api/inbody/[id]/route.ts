import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import {
  transformDbInBodyToInBody,
  InBodyUpdateData,
  DbInBodyRecord,
} from '@/lib/types/inbody';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/inbody/[id]
 * 특정 InBody 기록 조회
 */
export const GET = withAuth(
  async (request: NextRequest, { userId, supabase }) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: '기록 ID가 필요합니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('inbody_records')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '기록을 찾을 수 없습니다.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      console.error('[InBody GET/:id] Error:', error);
      return NextResponse.json(
        { error: '기록을 불러오는데 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const record = transformDbInBodyToInBody(data as DbInBodyRecord);
    return NextResponse.json(record);
  }
);

/**
 * PATCH /api/inbody/[id]
 * InBody 기록 수정
 */
export const PATCH = withAuth(
  async (request: NextRequest, { userId, supabase }) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: '기록 ID가 필요합니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    let body: InBodyUpdateData;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // camelCase → snake_case 변환
    const updateData: Record<string, unknown> = {};
    if (body.measuredAt !== undefined) updateData.measured_at = body.measuredAt;
    if (body.weight !== undefined) updateData.weight = body.weight;
    if (body.skeletalMuscleMass !== undefined) updateData.skeletal_muscle_mass = body.skeletalMuscleMass;
    if (body.bodyFatPercentage !== undefined) updateData.body_fat_percentage = body.bodyFatPercentage;
    if (body.bmi !== undefined) updateData.bmi = body.bmi;
    if (body.inbodyScore !== undefined) updateData.inbody_score = body.inbodyScore;
    if (body.totalBodyWater !== undefined) updateData.total_body_water = body.totalBodyWater;
    if (body.protein !== undefined) updateData.protein = body.protein;
    if (body.minerals !== undefined) updateData.minerals = body.minerals;
    if (body.bodyFatMass !== undefined) updateData.body_fat_mass = body.bodyFatMass;
    if (body.rightArmMuscle !== undefined) updateData.right_arm_muscle = body.rightArmMuscle;
    if (body.leftArmMuscle !== undefined) updateData.left_arm_muscle = body.leftArmMuscle;
    if (body.trunkMuscle !== undefined) updateData.trunk_muscle = body.trunkMuscle;
    if (body.rightLegMuscle !== undefined) updateData.right_leg_muscle = body.rightLegMuscle;
    if (body.leftLegMuscle !== undefined) updateData.left_leg_muscle = body.leftLegMuscle;
    if (body.rightArmFat !== undefined) updateData.right_arm_fat = body.rightArmFat;
    if (body.leftArmFat !== undefined) updateData.left_arm_fat = body.leftArmFat;
    if (body.trunkFat !== undefined) updateData.trunk_fat = body.trunkFat;
    if (body.rightLegFat !== undefined) updateData.right_leg_fat = body.rightLegFat;
    if (body.leftLegFat !== undefined) updateData.left_leg_fat = body.leftLegFat;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '수정할 데이터가 없습니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('inbody_records')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '기록을 찾을 수 없습니다.', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      // 중복 날짜 체크
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '해당 날짜에 이미 기록이 존재합니다.', code: 'ALREADY_EXISTS' },
          { status: 409 }
        );
      }
      console.error('[InBody PATCH/:id] Error:', error);
      return NextResponse.json(
        { error: '기록 수정에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    const record = transformDbInBodyToInBody(data as DbInBodyRecord);
    return NextResponse.json(record);
  }
);

/**
 * DELETE /api/inbody/[id]
 * InBody 기록 삭제
 */
export const DELETE = withAuth(
  async (request: NextRequest, { userId, supabase }) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: '기록 ID가 필요합니다.', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('inbody_records')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[InBody DELETE/:id] Error:', error);
      return NextResponse.json(
        { error: '기록 삭제에 실패했습니다.', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  }
);
