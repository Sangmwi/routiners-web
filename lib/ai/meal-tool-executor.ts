/**
 * Meal AI Tool Executor
 *
 * 식단 AI 전용 도구 실행 함수들
 * 운동 AI (tool-executor.ts)와 병렬 구조
 *
 * 공유 도구 (tool-executor.ts에서 재사용):
 * - executeGetUserBasicInfo
 * - executeGetUserBodyMetrics
 * - executeGetFitnessProfile
 * - executeRequestUserInput
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AIToolResult } from '@/lib/types';
import type {
  DietaryProfile,
  DietaryGoal,
  DietType,
  FoodRestriction,
  AvailableSource,
  EatingHabit,
  MealPlanPreviewData,
  MealPreviewWeek,
  MealPreviewDay,
  MealPreviewMeal,
  MealPlanConflict,
  MealData,
  Meal,
  FoodItem,
  MealType,
} from '@/lib/types/meal';
import type { EventType } from '@/lib/types/routine';
import {
  parseDietaryProfileUpdate,
  parseCalculateDailyNeedsInput,
  ACTIVITY_LEVEL_MULTIPLIERS,
  type DietaryProfileUpdate,
  type CalculateDailyNeedsInput,
} from './meal-schemas';
import { getNextMonday, formatDate, checkEventDateConflicts, calculateAge } from './tool-utils';
import { insertEventsWithConflictCheck, updateConversationApplied, type EventInsertData } from './event-factory';

// ============================================================================
// Executor Context (tool-executor.ts와 동일)
// ============================================================================

export interface MealToolExecutorContext {
  userId: string;
  supabase: SupabaseClient;
  conversationId: string;
}

// ============================================================================
// Result Types
// ============================================================================

export interface DietaryProfileResult {
  dietaryGoal: DietaryGoal | null;
  dietType: DietType | null;
  targetCalories: number | null;
  targetProtein: number | null;
  mealsPerDay: number | null;
  foodRestrictions: FoodRestriction[];
  availableSources: AvailableSource[];
  eatingHabits: EatingHabit[];
  budgetPerMonth: number | null;
  preferences: string[];
}

export interface DailyNeedsResult {
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  recommendation: string;
}

export interface MealPlanApplyResult {
  saved: boolean;
  eventsCreated: number;
  startDate: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

// getNextMonday, formatDate → tool-utils.ts로 이동

/**
 * Harris-Benedict 공식으로 BMR 계산
 */
function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female'
): number {
  if (gender === 'male') {
    // 남성: BMR = 88.362 + (13.397 × 체중kg) + (4.799 × 키cm) − (5.677 × 나이)
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    // 여성: BMR = 447.593 + (9.247 × 체중kg) + (3.098 × 키cm) − (4.330 × 나이)
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
}

// ============================================================================
// Tool Executors
// ============================================================================

/**
 * 1. get_dietary_profile
 *
 * 사용자의 식단 프로필 조회
 */
export async function executeGetDietaryProfile(
  ctx: MealToolExecutorContext
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
      dietaryGoal: data.dietary_goal as DietaryGoal | null,
      dietType: data.diet_type as DietType | null,
      targetCalories: data.target_calories,
      targetProtein: data.target_protein,
      mealsPerDay: data.meals_per_day,
      foodRestrictions: (data.food_restrictions ?? []) as FoodRestriction[],
      availableSources: (data.available_sources ?? []) as AvailableSource[],
      eatingHabits: (data.eating_habits ?? []) as EatingHabit[],
      budgetPerMonth: data.budget_per_month,
      preferences: data.preferences ?? [],
    },
  };
}

/**
 * 2. update_dietary_profile
 *
 * 식단 프로필 업데이트 (upsert)
 */
export async function executeUpdateDietaryProfile(
  ctx: MealToolExecutorContext,
  args: Record<string, unknown>
): Promise<AIToolResult<{ updated: boolean }>> {
  // Zod 스키마로 검증
  const parseResult = parseDietaryProfileUpdate(args);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error };
  }

  const validated = parseResult.data;

  // null/undefined가 아닌 값만 업데이트 데이터에 포함
  const updateData: Record<string, unknown> = {};

  if (validated.dietary_goal !== undefined && validated.dietary_goal !== null) {
    updateData.dietary_goal = validated.dietary_goal;
  }
  if (validated.diet_type !== undefined && validated.diet_type !== null) {
    updateData.diet_type = validated.diet_type;
  }
  if (validated.target_calories !== undefined && validated.target_calories !== null) {
    updateData.target_calories = validated.target_calories;
  }
  if (validated.target_protein !== undefined && validated.target_protein !== null) {
    updateData.target_protein = validated.target_protein;
  }
  if (validated.meals_per_day !== undefined && validated.meals_per_day !== null) {
    updateData.meals_per_day = validated.meals_per_day;
  }
  if (validated.food_restrictions !== undefined && validated.food_restrictions !== null) {
    updateData.food_restrictions = validated.food_restrictions;
  }
  if (validated.available_sources !== undefined && validated.available_sources !== null) {
    updateData.available_sources = validated.available_sources;
  }
  if (validated.eating_habits !== undefined && validated.eating_habits !== null) {
    updateData.eating_habits = validated.eating_habits;
  }
  if (validated.budget_per_month !== undefined && validated.budget_per_month !== null) {
    updateData.budget_per_month = validated.budget_per_month;
  }
  if (validated.preferences !== undefined && validated.preferences !== null) {
    updateData.preferences = validated.preferences;
  }
  if (validated.ai_notes !== undefined && validated.ai_notes !== null) {
    updateData.ai_notes = validated.ai_notes;
  }

  if (Object.keys(updateData).length === 0) {
    return { success: true, data: { updated: false } };
  }

  // Upsert: 없으면 생성, 있으면 업데이트
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
    console.error('[update_dietary_profile] UpdateData:', updateData);
    return { success: false, error: `식단 프로필 업데이트에 실패했습니다: ${error.message}` };
  }

  return { success: true, data: { updated: true } };
}

/**
 * 3. calculate_daily_needs
 *
 * TDEE 및 목표 매크로 계산
 * 사용자의 신체 정보와 활동 수준을 기반으로 계산
 */
export async function executeCalculateDailyNeeds(
  ctx: MealToolExecutorContext,
  args: Record<string, unknown>
): Promise<AIToolResult<DailyNeedsResult>> {
  // 입력 검증
  const parseResult = parseCalculateDailyNeedsInput(args);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error };
  }

  const { activity_level, goal } = parseResult.data;

  // 사용자 신체 정보 조회
  const { data: user, error } = await ctx.supabase
    .from('users')
    .select('height_cm, weight_kg, birth_date, gender')
    .eq('id', ctx.userId)
    .single();

  if (error || !user) {
    return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
  }

  if (!user.height_cm || !user.weight_kg || !user.birth_date || !user.gender) {
    return {
      success: false,
      error: '키, 몸무게, 생년월일, 성별 정보가 필요합니다. 프로필을 먼저 완성해주세요.',
    };
  }

  const age = calculateAge(user.birth_date);
  const bmr = calculateBMR(user.weight_kg, user.height_cm, age, user.gender as 'male' | 'female');
  const activityMultiplier = ACTIVITY_LEVEL_MULTIPLIERS[activity_level];
  const tdee = Math.round(bmr * activityMultiplier);

  // 목표에 따른 칼로리 조정
  let targetCalories: number;
  let recommendation: string;

  switch (goal) {
    case 'muscle_gain':
      targetCalories = Math.round(tdee + 400); // +400kcal 서플러스
      recommendation = '근육 증가를 위해 TDEE보다 400kcal 더 섭취하세요. 단백질 섭취에 집중하세요.';
      break;
    case 'fat_loss':
      targetCalories = Math.round(tdee - 400); // -400kcal 적자
      recommendation = '체지방 감소를 위해 TDEE보다 400kcal 적게 섭취하세요. 단백질을 충분히 섭취하여 근손실을 방지하세요.';
      break;
    case 'maintenance':
    default:
      targetCalories = tdee;
      recommendation = '현재 체중 유지를 위해 TDEE에 맞춰 섭취하세요.';
      break;
  }

  // 매크로 계산 (일반적인 비율 적용)
  // 단백질: 체중 kg당 1.6-2.2g (근육 증가 시 높게)
  const proteinPerKg = goal === 'muscle_gain' ? 2.0 : goal === 'fat_loss' ? 2.2 : 1.6;
  const targetProtein = Math.round(user.weight_kg * proteinPerKg);

  // 지방: 총 칼로리의 25-30%
  const fatCalories = targetCalories * 0.25;
  const targetFat = Math.round(fatCalories / 9); // 지방 1g = 9kcal

  // 탄수화물: 나머지
  const proteinCalories = targetProtein * 4; // 단백질 1g = 4kcal
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const targetCarbs = Math.round(carbCalories / 4); // 탄수화물 1g = 4kcal

  return {
    success: true,
    data: {
      tdee,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      recommendation,
    },
  };
}

/**
 * 4. generate_meal_plan_preview
 *
 * 식단 미리보기 생성 (DB 저장 없음)
 */
export function executeGenerateMealPlanPreview(
  args: {
    title: string;
    description: string;
    duration_weeks: number;
    target_calories: number;
    target_protein: number;
    weeks: Array<{
      weekNumber: number;
      days: Array<{
        dayOfWeek: number;
        meals: Array<{
          type: MealType;
          time?: string;
          foods: Array<{
            name: string;
            portion: string;
            calories?: number;
            protein?: number;
            source?: string;
          }>;
          totalCalories?: number;
        }>;
        totalCalories?: number;
        notes?: string;
      }>;
    }>;
  },
  toolCallId: string
): AIToolResult<MealPlanPreviewData> {
  // 미리보기 ID 생성
  const previewId = `meal-preview-${toolCallId}`;

  // weeks 데이터를 MealPreviewWeek[] 형태로 변환
  const weeks: MealPreviewWeek[] = args.weeks.map((week) => ({
    weekNumber: week.weekNumber,
    days: week.days.map((day): MealPreviewDay => ({
      dayOfWeek: day.dayOfWeek,
      meals: day.meals.map((meal): MealPreviewMeal => ({
        type: meal.type,
        time: meal.time,
        foods: meal.foods.map((food) => ({
          name: food.name,
          portion: food.portion,
          calories: food.calories,
          protein: food.protein,
          source: food.source,
        })),
        totalCalories: meal.totalCalories,
      })),
      totalCalories: day.totalCalories,
      notes: day.notes,
    })),
  }));

  const previewData: MealPlanPreviewData = {
    id: previewId,
    title: args.title,
    description: args.description,
    durationWeeks: args.duration_weeks,
    targetCalories: args.target_calories,
    targetProtein: args.target_protein,
    weeks,
    // 원본 데이터 저장 (apply_meal_plan에서 사용)
    rawMealData: {
      title: args.title,
      description: args.description,
      duration_weeks: args.duration_weeks,
      target_calories: args.target_calories,
      target_protein: args.target_protein,
      weeks: args.weeks,
    },
  };

  return {
    success: true,
    data: previewData,
  };
}

/**
 * 4-1. 식단 충돌 체크
 *
 * 새 식단이 적용될 날짜들에 기존 식단이 있는지 확인
 */
export async function checkMealDateConflicts(
  ctx: MealToolExecutorContext,
  previewData: MealPlanPreviewData
): Promise<MealPlanConflict[]> {
  return checkEventDateConflicts(ctx, previewData, 'meal');
}

/**
 * 5. apply_meal_plan
 *
 * 미리보기 데이터를 실제 routine_events 테이블에 저장
 */
export async function executeApplyMealPlan(
  ctx: MealToolExecutorContext,
  previewData: MealPlanPreviewData
): Promise<AIToolResult<MealPlanApplyResult>> {
  try {
    if (!previewData.rawMealData) {
      return { success: false, error: '미리보기 데이터를 찾을 수 없습니다.' };
    }

    const rawData = previewData.rawMealData as {
      title: string;
      description: string;
      duration_weeks: number;
      target_calories: number;
      target_protein: number;
      weeks: Array<{
        weekNumber: number;
        days: Array<{
          dayOfWeek: number;
          meals: Array<{
            type: MealType;
            time?: string;
            foods: Array<{
              name: string;
              portion: string;
              calories?: number;
              protein?: number;
              source?: string;
            }>;
            totalCalories?: number;
          }>;
          totalCalories?: number;
          notes?: string;
        }>;
      }>;
    };

    // routine_events INSERT 데이터 생성
    const events: Array<{
      user_id: string;
      type: EventType;
      date: string;
      title: string;
      data: MealData;
      rationale: string | null;
      status: 'scheduled';
      source: 'ai';
      ai_session_id: string;
    }> = [];

    const startDate = getNextMonday();

    for (const week of rawData.weeks) {
      for (const day of week.days) {
        const weekOffset = week.weekNumber - 1;
        const dayOffset = day.dayOfWeek - 1;

        const eventDate = new Date(startDate);
        eventDate.setDate(startDate.getDate() + weekOffset * 7 + dayOffset);

        // MealData 구성
        const meals: Meal[] = day.meals.map((meal) => ({
          type: meal.type,
          time: meal.time,
          foods: meal.foods.map((food, idx): FoodItem => ({
            id: `food-${idx}`,
            name: food.name,
            portion: food.portion,
            calories: food.calories,
            protein: food.protein,
            source: food.source as FoodItem['source'],
          })),
          totalCalories: meal.totalCalories,
        }));

        const mealData: MealData = {
          meals,
          targetCalories: rawData.target_calories,
          targetProtein: rawData.target_protein,
          estimatedTotalCalories: day.totalCalories,
          notes: day.notes,
        };

        events.push({
          user_id: ctx.userId,
          type: 'meal',
          date: formatDate(eventDate),
          title: `${rawData.title} - ${week.weekNumber}주차`,
          data: mealData,
          rationale: null,
          status: 'scheduled',
          source: 'ai',
          ai_session_id: ctx.conversationId,
        });
      }
    }

    // 팩토리로 충돌 체크 + 삽입 (meal은 기존 식단 덮어쓰기)
    const insertResult = await insertEventsWithConflictCheck(
      ctx,
      events as EventInsertData[],
      'meal',
      'overwrite'
    );

    if (!insertResult.success) {
      return { success: false, error: insertResult.error };
    }

    // 대화 상태 업데이트
    await updateConversationApplied(ctx.supabase, ctx.conversationId);

    return {
      success: true,
      data: {
        saved: true,
        eventsCreated: insertResult.eventsCreated!,
        startDate: insertResult.startDate!,
      },
    };
  } catch (err) {
    console.error('[apply_meal_plan] Unexpected error:', err);
    return { success: false, error: '식단 적용 중 오류가 발생했습니다.' };
  }
}

// ============================================================================
// Main Executor
// ============================================================================

/**
 * 식단 도구 실행 메인 함수
 */
export async function executeMealTool(
  toolName: string,
  args: Record<string, unknown>,
  ctx: MealToolExecutorContext
): Promise<AIToolResult> {
  switch (toolName) {
    case 'get_dietary_profile':
      return executeGetDietaryProfile(ctx);

    case 'update_dietary_profile':
      return executeUpdateDietaryProfile(ctx, args);

    case 'calculate_daily_needs':
      return executeCalculateDailyNeeds(ctx, args);

    case 'generate_meal_plan_preview':
      // 이 도구는 API route에서 직접 처리 (meal_plan_preview SSE 이벤트 전송)
      return { success: false, error: 'generate_meal_plan_preview는 API route에서 직접 처리해야 합니다.' };

    case 'apply_meal_plan':
      // 이 도구는 API route에서 직접 처리 (preview 데이터 조회 필요)
      return { success: false, error: 'apply_meal_plan은 API route에서 직접 처리해야 합니다.' };

    default:
      return { success: false, error: `알 수 없는 식단 도구: ${toolName}` };
  }
}
