/**
 * TDEE & Macro Calculation
 *
 * Mifflin-St Jeor 공식 기반 일일 에너지 소비량 및 매크로 영양소 계산
 * AI executor와 API route에서 공통 사용
 */

import type { DietaryGoal, DietType } from '@/lib/types/meal';

// ============================================================================
// BMR (Basal Metabolic Rate)
// ============================================================================

/**
 * Mifflin-St Jeor 공식으로 기초대사량 계산
 *
 * Male:   BMR = 10×weight(kg) + 6.25×height(cm) - 5×age + 5
 * Female: BMR = 10×weight(kg) + 6.25×height(cm) - 5×age - 161
 */
export function calculateBMR(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female';
}): number {
  const { weightKg, heightCm, age, gender } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

// ============================================================================
// TDEE (Total Daily Energy Expenditure)
// ============================================================================

/**
 * 활동 수준별 곱수
 *
 * 군인은 기본 훈련과 체력 단련이 포함되어 very_active(1.725) 기본 적용
 */
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,       // 비활동적
  lightly_active: 1.375, // 가벼운 활동
  moderately_active: 1.55, // 보통 활동
  very_active: 1.725,    // 활발한 활동 (군인 기본)
  extremely_active: 1.9,  // 매우 활발
} as const;

const DEFAULT_ACTIVITY_MULTIPLIER = ACTIVITY_MULTIPLIERS.very_active;

/**
 * TDEE = BMR × 활동 곱수
 */
export function calculateTDEE(bmr: number, activityMultiplier?: number): number {
  return Math.round(bmr * (activityMultiplier ?? DEFAULT_ACTIVITY_MULTIPLIER));
}

// ============================================================================
// Daily Targets (목표별 칼로리 조정 + 매크로 분배)
// ============================================================================

/** 목표별 칼로리 조정값 (kcal) */
const GOAL_ADJUSTMENTS: Record<DietaryGoal, number> = {
  muscle_gain: 300,
  fat_loss: -400,
  maintenance: 0,
  health: 0,
  performance: 200,
};

/** 식단 유형별 매크로 비율 (protein / carbs / fat) */
const MACRO_RATIOS: Record<DietType, { protein: number; carbs: number; fat: number }> = {
  regular: { protein: 0.3, carbs: 0.5, fat: 0.2 },
  balanced: { protein: 0.3, carbs: 0.5, fat: 0.2 },
  high_protein: { protein: 0.4, carbs: 0.35, fat: 0.25 },
  low_carb: { protein: 0.35, carbs: 0.25, fat: 0.4 },
  bulking: { protein: 0.25, carbs: 0.55, fat: 0.2 },
  cutting: { protein: 0.4, carbs: 0.35, fat: 0.25 },
};

const DEFAULT_MACRO_RATIO = MACRO_RATIOS.balanced;

/**
 * 목표별 칼로리 조정 + 매크로 분배
 *
 * 칼로리 → 매크로 변환:
 * - 단백질/탄수화물: 1g = 4kcal
 * - 지방: 1g = 9kcal
 */
export function calculateDailyTargets(params: {
  tdee: number;
  dietaryGoal: DietaryGoal | null;
  dietType: DietType | null;
}): {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
} {
  const { tdee, dietaryGoal, dietType } = params;

  const adjustment = dietaryGoal ? (GOAL_ADJUSTMENTS[dietaryGoal] ?? 0) : 0;
  const targetCalories = Math.round(tdee + adjustment);

  const ratio = dietType ? (MACRO_RATIOS[dietType] ?? DEFAULT_MACRO_RATIO) : DEFAULT_MACRO_RATIO;

  return {
    targetCalories,
    targetProtein: Math.round((targetCalories * ratio.protein) / 4),
    targetCarbs: Math.round((targetCalories * ratio.carbs) / 4),
    targetFat: Math.round((targetCalories * ratio.fat) / 9),
  };
}
