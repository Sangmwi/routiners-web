import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/supabase/auth';
import { UNITS } from '@/lib/constants/units';
import { getUnitMealTemplate } from '@/lib/data/unitMeals';
import { simulateDelay } from '@/lib/utils/simulateDelay';
import type { UnitMealMenu } from '@/lib/types/unitMeal';

/**
 * GET /api/meal/unit-menu?unitId=xxx&date=YYYY-MM-DD
 *
 * 부대 식단 메뉴 조회
 * MVP: 더미데이터 반환 (unitId 무관, 요일 기반)
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get('unitId');
  const date = searchParams.get('date');

  if (!unitId || !date) {
    return NextResponse.json(
      { error: 'unitId와 date는 필수 파라미터입니다.', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: '날짜 형식은 YYYY-MM-DD여야 합니다.', code: 'BAD_REQUEST' },
      { status: 400 },
    );
  }

  const unit = UNITS.find((u) => u.id === unitId);
  if (!unit) {
    return NextResponse.json(
      { error: '해당 부대를 찾을 수 없습니다.', code: 'NOT_FOUND' },
      { status: 404 },
    );
  }

  // MVP: 실제 API 호출처럼 보이도록 지연 시뮬레이션
  await simulateDelay(400, 700);

  const meals = getUnitMealTemplate(date);
  const estimatedTotalCalories = meals.reduce(
    (sum, m) => sum + (m.totalCalories ?? 0),
    0,
  );

  const response: UnitMealMenu = {
    unitId,
    unitName: unit.name,
    date,
    meals,
    estimatedTotalCalories,
    source: 'dummy',
  };

  return NextResponse.json(response);
});
