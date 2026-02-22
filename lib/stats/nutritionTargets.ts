/**
 * Nutrition Target Resolution
 *
 * 이벤트 target → 프로필 target → 없음 순으로 fallback하여
 * 통계 페이지에서 사용할 일일/기간 목표값을 해석
 */

import type { DietaryProfile, DietType, DietaryGoal } from '@/lib/types/meal';
import type { MealMetrics } from '@/lib/stats/computations';
import { MACRO_RATIOS, DEFAULT_MACRO_RATIO } from '@/lib/utils/tdee';

export interface NutritionTargets {
  /** 목표 데이터 출처 */
  source: 'event' | 'profile' | 'none';
  /** 목표 데이터 존재 여부 */
  hasTargets: boolean;
  /** 일일 목표 */
  daily: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  /** 기간 목표 (주간/월간 합산) */
  period: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  dietType?: DietType;
  dietaryGoal?: DietaryGoal;
}

/**
 * 사용 가능한 가장 정확한 target 데이터를 해석
 *
 * 우선순위:
 * 1. 이벤트별 target (MealData.targetCalories 등) — AI가 설정한 정확한 값
 * 2. DietaryProfile의 target — 사용자 프로필 기반
 * 3. 없음 — DonutChart 폴백
 */
export function resolveNutritionTargets(
  mealMetrics: MealMetrics,
  profile: DietaryProfile | null,
  daysInPeriod: number,
): NutritionTargets {
  const dietType = profile?.dietType ?? undefined;
  const dietaryGoal = profile?.dietaryGoal;
  const ratio = dietType ? (MACRO_RATIOS[dietType] ?? DEFAULT_MACRO_RATIO) : DEFAULT_MACRO_RATIO;

  // Strategy 1: 이벤트별 target 데이터 존재
  if (mealMetrics.daysWithTargets > 0 && mealMetrics.targetCalories > 0) {
    const avgDailyCal = mealMetrics.avgTargetCalories;
    const avgDailyProtein = mealMetrics.daysWithTargets > 0
      ? Math.round(mealMetrics.targetProtein / mealMetrics.daysWithTargets)
      : 0;
    const avgDailyCarbs = Math.round((avgDailyCal * ratio.carbs) / 4);
    const avgDailyFat = Math.round((avgDailyCal * ratio.fat) / 9);

    return {
      source: 'event',
      hasTargets: true,
      daily: { calories: avgDailyCal, protein: avgDailyProtein, carbs: avgDailyCarbs, fat: avgDailyFat },
      period: {
        calories: avgDailyCal * daysInPeriod,
        protein: avgDailyProtein * daysInPeriod,
        carbs: avgDailyCarbs * daysInPeriod,
        fat: avgDailyFat * daysInPeriod,
      },
      dietType,
      dietaryGoal,
    };
  }

  // Strategy 2: 프로필 target 존재
  if (profile?.targetCalories) {
    const dailyCal = profile.targetCalories;
    const dailyProtein = profile.targetProtein ?? Math.round((dailyCal * ratio.protein) / 4);
    const dailyCarbs = Math.round((dailyCal * ratio.carbs) / 4);
    const dailyFat = Math.round((dailyCal * ratio.fat) / 9);

    return {
      source: 'profile',
      hasTargets: true,
      daily: { calories: dailyCal, protein: dailyProtein, carbs: dailyCarbs, fat: dailyFat },
      period: {
        calories: dailyCal * daysInPeriod,
        protein: dailyProtein * daysInPeriod,
        carbs: dailyCarbs * daysInPeriod,
        fat: dailyFat * daysInPeriod,
      },
      dietType,
      dietaryGoal,
    };
  }

  // Strategy 3: 목표 데이터 없음
  return {
    source: 'none',
    hasTargets: false,
    daily: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    period: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    dietType,
    dietaryGoal,
  };
}
