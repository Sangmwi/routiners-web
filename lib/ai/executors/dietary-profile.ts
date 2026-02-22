/**
 * Dietary Profile Executors
 *
 * 식단 프로필 조회/수정 + 일일 영양 필요량 계산 (TDEE)
 * fitness-profile.ts 패턴 동일
 */

import type { AIToolResult } from '@/lib/types';
import type { DietaryProfileResult, DailyNeedsResult, DietaryGoal, DietType } from '@/lib/types/meal';
import { calculateAge } from '../tool-utils';
import { calculateBMR, calculateTDEE, calculateDailyTargets } from '@/lib/utils/tdee';
import type { ToolExecutorContext } from './types';

// ============================================================================
// Executors
// ============================================================================

/**
 * get_dietary_profile
 *
 * dietary_profiles 테이블에서 식단 프로필 조회
 * fitness_profiles의 executeGetFitnessProfile과 동일 패턴
 */
export async function executeGetDietaryProfile(
  ctx: ToolExecutorContext
): Promise<AIToolResult<DietaryProfileResult>> {
  const { data, error } = await ctx.supabase
    .from('dietary_profiles')
    .select(`
      dietary_goal,
      diet_type,
      target_calories,
      target_protein,
      meals_per_day,
      food_restrictions,
      available_sources,
      eating_habits,
      budget_per_month,
      preferences
    `)
    .eq('user_id', ctx.userId)
    .single();

  if (error) {
    // 프로필이 없는 경우 빈 값 반환 (정상 케이스)
    if (error.code === 'PGRST116') {
      return {
        success: true,
        data: {
          dietaryGoal: null,
          dietType: null,
          targetCalories: null,
          targetProtein: null,
          mealsPerDay: null,
          foodRestrictions: [],
          availableSources: [],
          eatingHabits: [],
          budgetPerMonth: null,
          preferences: [],
        },
      };
    }
    return { success: false, error: '식단 프로필을 조회할 수 없습니다.' };
  }

  return {
    success: true,
    data: {
      dietaryGoal: data.dietary_goal,
      dietType: data.diet_type,
      targetCalories: data.target_calories,
      targetProtein: data.target_protein,
      mealsPerDay: data.meals_per_day,
      foodRestrictions: data.food_restrictions ?? [],
      availableSources: data.available_sources ?? [],
      eatingHabits: data.eating_habits ?? [],
      budgetPerMonth: data.budget_per_month,
      preferences: data.preferences ?? [],
    },
  };
}

/**
 * update_dietary_profile
 *
 * null이 아닌 값만 upsert
 */
export async function executeUpdateDietaryProfile(
  ctx: ToolExecutorContext,
  args: {
    dietary_goal: string | null;
    diet_type: string | null;
    target_calories: number | null;
    target_protein: number | null;
    meals_per_day: number | null;
    food_restrictions: string[] | null;
    available_sources: string[] | null;
    eating_habits: string[] | null;
    budget_per_month: number | null;
    preferences: string[] | null;
    ai_notes: Record<string, unknown> | null;
  }
): Promise<AIToolResult<{ updated: boolean }>> {
  const updateData: Record<string, unknown> = {};

  if (args.dietary_goal !== null) updateData.dietary_goal = args.dietary_goal;
  if (args.diet_type !== null) updateData.diet_type = args.diet_type;
  if (args.target_calories !== null) updateData.target_calories = args.target_calories;
  if (args.target_protein !== null) updateData.target_protein = args.target_protein;
  if (args.meals_per_day !== null) updateData.meals_per_day = args.meals_per_day;
  if (args.food_restrictions !== null) updateData.food_restrictions = args.food_restrictions;
  if (args.available_sources !== null) updateData.available_sources = args.available_sources;
  if (args.eating_habits !== null) updateData.eating_habits = args.eating_habits;
  if (args.budget_per_month !== null) updateData.budget_per_month = args.budget_per_month;
  if (args.preferences !== null) updateData.preferences = args.preferences;
  if (args.ai_notes !== null) updateData.ai_notes = args.ai_notes;

  if (Object.keys(updateData).length === 0) {
    return { success: true, data: { updated: false } };
  }

  const { error } = await ctx.supabase
    .from('dietary_profiles')
    .upsert(
      {
        user_id: ctx.userId,
        ...updateData,
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('[update_dietary_profile] Error:', error);
    return { success: false, error: `식단 프로필 업데이트에 실패했습니다: ${error.message}` };
  }

  return { success: true, data: { updated: true } };
}

/**
 * calculate_daily_needs
 *
 * 사용자 신체정보 + 식단 프로필 → TDEE 기반 일일 영양 필요량 계산
 */
export async function executeCalculateDailyNeeds(
  ctx: ToolExecutorContext
): Promise<AIToolResult<DailyNeedsResult>> {
  // 1. 신체정보 조회
  const { data: user, error: userError } = await ctx.supabase
    .from('users')
    .select('height_cm, weight_kg, birth_date, gender')
    .eq('id', ctx.userId)
    .single();

  if (userError || !user) {
    return { success: false, error: '사용자 정보를 조회할 수 없습니다.' };
  }

  // 필수 필드 검증
  const missing: string[] = [];
  if (!user.height_cm) missing.push('키(height_cm)');
  if (!user.weight_kg) missing.push('몸무게(weight_kg)');
  if (!user.birth_date) missing.push('생년월일(birth_date)');
  if (!user.gender) missing.push('성별(gender)');

  if (missing.length > 0) {
    return {
      success: false,
      error: `TDEE 계산에 필요한 정보가 없습니다: ${missing.join(', ')}. 사용자에게 해당 정보를 먼저 질문하세요.`,
    };
  }

  // 2. 식단 프로필 조회
  const { data: profile } = await ctx.supabase
    .from('dietary_profiles')
    .select('dietary_goal, diet_type')
    .eq('user_id', ctx.userId)
    .single();

  // 프로필 없어도 기본값으로 계산 가능

  // 3. TDEE 계산
  const age = calculateAge(user.birth_date);
  const bmr = calculateBMR({
    weightKg: user.weight_kg,
    heightCm: user.height_cm,
    age,
    gender: user.gender as 'male' | 'female',
  });
  const tdee = calculateTDEE(bmr);

  // 4. 목표별 매크로 계산
  const dietaryGoal = (profile?.dietary_goal as DietaryGoal) ?? null;
  const dietType = (profile?.diet_type as DietType) ?? null;
  const targets = calculateDailyTargets({ tdee, dietaryGoal, dietType });

  // 5. 추천 메시지 생성
  const goalLabel = dietaryGoal
    ? { muscle_gain: '근육 증가', fat_loss: '체지방 감소', maintenance: '체중 유지', health: '건강 유지', performance: '퍼포먼스 향상' }[dietaryGoal]
    : '균형 잡힌 식단';

  const recommendation = `기초대사량(BMR) ${bmr}kcal, 활동대사량(TDEE) ${tdee}kcal 기준으로 ${goalLabel} 목표에 맞는 일일 ${targets.targetCalories}kcal를 권장합니다.`;

  return {
    success: true,
    data: {
      tdee,
      ...targets,
      recommendation,
    },
  };
}
