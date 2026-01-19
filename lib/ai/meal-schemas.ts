/**
 * Meal AI Tool Schemas
 *
 * 식단 AI 도구 입력 데이터의 Zod 스키마 정의
 * 운동 AI (schemas.ts)와 병렬 구조
 */

import { z } from 'zod';
import {
  DIETARY_GOALS,
  DIET_TYPES,
  FOOD_RESTRICTIONS,
  AVAILABLE_SOURCES,
  EATING_HABITS,
} from '@/lib/types/meal';

// ============================================================================
// Food & Meal Schemas
// ============================================================================

/**
 * 음식 항목 스키마
 */
export const AIFoodItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, '음식 이름은 필수입니다'),
  category: z.string().optional(), // main, side, soup, rice, protein, vegetable, snack, drink
  portion: z.string().min(1, '분량은 필수입니다'),
  calories: z.number().int().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  source: z.string().optional(), // canteen, px, outside, homemade
  alternatives: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type AIFoodItem = z.infer<typeof AIFoodItemSchema>;

/**
 * 단일 식사 스키마
 */
export const AIMealSchema = z.object({
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  time: z.string().optional(),
  foods: z.array(AIFoodItemSchema).min(1, '최소 1개 이상의 음식이 필요합니다'),
  totalCalories: z.number().int().nonnegative().optional(),
  totalProtein: z.number().nonnegative().optional(),
  totalCarbs: z.number().nonnegative().optional(),
  totalFat: z.number().nonnegative().optional(),
  tips: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type AIMeal = z.infer<typeof AIMealSchema>;

/**
 * 하루 식단 스키마
 */
export const AIMealDaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7), // 1=월, 7=일
  meals: z.array(AIMealSchema).min(1, '최소 1끼 이상의 식사가 필요합니다'),
  totalCalories: z.number().int().nonnegative().optional(),
  totalProtein: z.number().nonnegative().optional(),
  waterIntake: z.number().nonnegative().optional(), // L 단위
  notes: z.string().optional(),
});

export type AIMealDay = z.infer<typeof AIMealDaySchema>;

/**
 * 주간 식단 스키마
 */
export const AIMealWeekSchema = z.object({
  weekNumber: z.number().int().positive(),
  days: z.array(AIMealDaySchema).min(1, '최소 1일 이상의 식단이 필요합니다'),
  weeklyGoal: z.string().optional(),
  notes: z.string().optional(),
});

export type AIMealWeek = z.infer<typeof AIMealWeekSchema>;

/**
 * 전체 식단 데이터 스키마
 */
export const AIMealPlanDataSchema = z.object({
  weeks: z.array(AIMealWeekSchema).min(1, '최소 1주 이상의 식단이 필요합니다'),
  targetCalories: z.number().int().positive().optional(),
  targetProtein: z.number().int().positive().optional(),
  targetCarbs: z.number().int().positive().optional(),
  targetFat: z.number().int().positive().optional(),
  dietType: z.string().optional(),
  overallGoal: z.string().optional(),
  tips: z.array(z.string()).optional(),
});

export type AIMealPlanData = z.infer<typeof AIMealPlanDataSchema>;

// ============================================================================
// Dietary Profile Schemas
// ============================================================================

/**
 * 식단 AI 노트 스키마
 */
export const DietaryAINotesSchema = z.object({
  summary: z.string().optional(),
  recommendations: z.string().optional(),
  observations: z.string().optional(),
  goals: z.string().optional(),
  concerns: z.string().optional(),
  mealTiming: z.string().optional(),
  supplementRecommendations: z.string().optional(),
}).passthrough(); // 추가 필드 허용

export type DietaryAINotes = z.infer<typeof DietaryAINotesSchema>;

/**
 * 식단 프로필 업데이트 스키마
 */
export const DietaryProfileUpdateSchema = z.object({
  dietary_goal: z.enum(DIETARY_GOALS).nullable().optional(),
  diet_type: z.enum(DIET_TYPES).nullable().optional(),
  target_calories: z.number().int().min(1000).max(5000).nullable().optional(),
  target_protein: z.number().int().min(30).max(400).nullable().optional(),
  meals_per_day: z.number().int().min(2).max(6).nullable().optional(),
  food_restrictions: z.array(z.enum(FOOD_RESTRICTIONS)).nullable().optional(),
  available_sources: z.array(z.enum(AVAILABLE_SOURCES)).nullable().optional(),
  eating_habits: z.array(z.enum(EATING_HABITS)).nullable().optional(),
  budget_per_month: z.number().int().min(30000).max(500000).nullable().optional(),
  preferences: z.array(z.string()).nullable().optional(),
  ai_notes: DietaryAINotesSchema.nullable().optional(),
});

export type DietaryProfileUpdate = z.infer<typeof DietaryProfileUpdateSchema>;

// ============================================================================
// Calculate Daily Needs Schema
// ============================================================================

/**
 * 활동 수준 enum
 */
export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

/**
 * 일일 필요량 계산 입력 스키마
 * - 신체정보는 대화에서 수집 시 전달 (선택적)
 * - 전달하지 않으면 DB에서 조회
 */
export const CalculateDailyNeedsInputSchema = z.object({
  activity_level: z.enum(ACTIVITY_LEVELS),
  goal: z.enum(['muscle_gain', 'fat_loss', 'maintenance']),
  // 선택적 신체정보 - 대화에서 수집 시 전달
  height_cm: z.number().positive().optional(),
  weight_kg: z.number().positive().optional(),
  birth_year: z.number().int().min(1900).max(2015).optional(),
  gender: z.enum(['male', 'female']).optional(),
});

export type CalculateDailyNeedsInput = z.infer<typeof CalculateDailyNeedsInputSchema>;

// ============================================================================
// Meal Plan Preview Schema
// ============================================================================

/**
 * 식단 미리보기 생성 요청 스키마
 */
export const GenerateMealPlanPreviewSchema = z.object({
  title: z.string().min(1, '식단 제목은 필수입니다'),
  description: z.string().min(1, '식단 설명은 필수입니다'),
  duration_weeks: z.number().int().min(1).max(4),
  target_calories: z.number().int().min(1000).max(5000),
  target_protein: z.number().int().min(30).max(400),
  weeks: z.array(AIMealWeekSchema).min(1),
});

export type GenerateMealPlanPreview = z.infer<typeof GenerateMealPlanPreviewSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * 안전한 파싱 결과 타입
 */
export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 식단 데이터 파싱 및 검증
 */
export function parseMealPlanData(data: unknown): ParseResult<AIMealPlanData> {
  const result = AIMealPlanDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessages = result.error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  return { success: false, error: `식단 데이터 검증 실패: ${errorMessages}` };
}

/**
 * 식단 프로필 업데이트 파싱 및 검증
 */
export function parseDietaryProfileUpdate(data: unknown): ParseResult<DietaryProfileUpdate> {
  const result = DietaryProfileUpdateSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessages = result.error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  return { success: false, error: `식단 프로필 데이터 검증 실패: ${errorMessages}` };
}

/**
 * 일일 필요량 계산 입력 파싱 및 검증
 */
export function parseCalculateDailyNeedsInput(data: unknown): ParseResult<CalculateDailyNeedsInput> {
  const result = CalculateDailyNeedsInputSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessages = result.error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  return { success: false, error: `입력 데이터 검증 실패: ${errorMessages}` };
}

/**
 * 식단 미리보기 요청 파싱 및 검증
 */
export function parseGenerateMealPlanPreview(data: unknown): ParseResult<GenerateMealPlanPreview> {
  const result = GenerateMealPlanPreviewSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessages = result.error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  return { success: false, error: `식단 미리보기 데이터 검증 실패: ${errorMessages}` };
}

// ============================================================================
// Activity Level Labels (한국어)
// ============================================================================

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  sedentary: '거의 운동 안 함',
  light: '가벼운 활동 (주 1-2회)',
  moderate: '보통 활동 (주 3-4회)',
  active: '활발한 활동 (주 5-6회)',
  very_active: '매우 활발 (매일 고강도)',
};

/**
 * 활동 수준별 TDEE 승수
 */
export const ACTIVITY_LEVEL_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};
