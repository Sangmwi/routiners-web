/**
 * AI Tool Schemas
 *
 * AI 도구 입력 데이터의 Zod 스키마 정의
 * OpenAI strict mode 대신 런타임 검증으로 타입 안전성 확보
 */

import { z } from 'zod';

// ============================================================================
// Routine Data Schemas
// ============================================================================

/**
 * 운동 세트 스키마
 */
export const AISetSchema = z.object({
  setNumber: z.number().int().positive().optional(),
  targetReps: z.number().int().positive(),
  targetWeight: z.number().nonnegative().optional(), // 0도 허용 (AI가 무게를 지정하지 않는 경우)
  restSeconds: z.number().int().positive().optional(),
});

export type AISet = z.infer<typeof AISetSchema>;

/**
 * 운동 스키마
 *
 * category, targetMuscle 등은 AI가 다양한 값을 생성할 수 있도록 string으로 완화
 * (enum 사용 시 AI 첫 시도 실패 → 재시도로 시간 2배 소요되는 문제 해결)
 */
export const AIExerciseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, '운동 이름은 필수입니다'),
  category: z.string().optional(), // compound, isolation, cardio, flexibility, core 등
  targetMuscle: z.string().optional(),
  sets: z.array(AISetSchema).optional(),
  restSeconds: z.number().int().positive().optional(),
  tempo: z.string().optional(), // e.g., "3-1-2-0"
  rir: z.number().int().min(0).max(10).optional(), // Reps In Reserve
  technique: z.string().optional(),
  notes: z.string().optional(),
  distance: z.number().min(0).max(200).optional(), // 유산소 거리 (km)
});

export type AIExercise = z.infer<typeof AIExerciseSchema>;

/**
 * 하루 운동 스키마
 *
 * workoutType은 AI가 다양한 값을 생성할 수 있도록 string으로 완화
 */
export const AIRoutineDaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7), // 1=월, 7=일
  title: z.string().optional(),
  workoutType: z.string().optional(), // push, pull, legs, upper, lower, full, cardio, rest, active_recovery 등
  exercises: z.array(AIExerciseSchema).optional(),
  estimatedDuration: z.number().int().positive().optional(), // 분 단위
  estimatedCaloriesBurned: z.number().int().min(0).max(5000).optional(), // kcal
  intensity: z.number().int().min(1).max(10).optional(), // 1-10 RPE
  warmup: z.string().optional(),
  cooldown: z.string().optional(),
  tips: z.array(z.string()).optional(),
  notes: z.string().optional(),
  rationale: z.string().optional(), // AI가 이 운동을 선택한 이유
});

export type AIRoutineDay = z.infer<typeof AIRoutineDaySchema>;

/**
 * 주간 운동 스키마
 */
export const AIWeekSchema = z.object({
  weekNumber: z.number().int().positive(),
  days: z.array(AIRoutineDaySchema),
  weeklyGoal: z.string().optional(),
  progressionNotes: z.string().optional(),
});

export type AIWeek = z.infer<typeof AIWeekSchema>;

/**
 * 전체 루틴 데이터 스키마
 */
export const AIRoutineDataSchema = z.object({
  weeks: z.array(AIWeekSchema).min(1, '최소 1주 이상의 루틴이 필요합니다'),
  overallGoal: z.string().optional(),
  targetAudience: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
});

export type AIRoutineData = z.infer<typeof AIRoutineDataSchema>;

// ============================================================================
// Fitness Profile Schemas
// ============================================================================

/**
 * AI 노트 스키마
 */
export const AINotesSchema = z.object({
  summary: z.string().optional(),
  recommendations: z.string().optional(),
  observations: z.string().optional(),
  goals: z.string().optional(),
  progress: z.string().optional(),
  concerns: z.string().optional(),
  nextSteps: z.string().optional(),
}).passthrough(); // 추가 필드 허용

export type AINotes = z.infer<typeof AINotesSchema>;

/**
 * 피트니스 프로필 업데이트 스키마
 */
export const FitnessProfileUpdateSchema = z.object({
  fitness_goal: z.string().nullable(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']).nullable(),
  preferred_days_per_week: z.number().int().min(1).max(7).nullable(),
  session_duration_minutes: z.number().int().min(15).max(180).nullable(),
  equipment_access: z.enum(['none', 'basic', 'full_gym', 'home_gym']).nullable(),
  focus_areas: z.array(z.string()).nullable(),
  injuries: z.array(z.string()).nullable(),
  preferences: z.array(z.string()).nullable(),
  restrictions: z.array(z.string()).nullable(),
  ai_notes: AINotesSchema.nullable(),
});

export type FitnessProfileUpdate = z.infer<typeof FitnessProfileUpdateSchema>;

// ============================================================================
// Save Routine Draft Schema
// ============================================================================

/**
 * 루틴 저장 요청 스키마
 */
export const SaveRoutineDraftSchema = z.object({
  title: z.string().min(1, '루틴 제목은 필수입니다'),
  description: z.string().min(1, '루틴 설명은 필수입니다'),
  duration_weeks: z.number().int().min(1).max(52),
  days_per_week: z.number().int().min(1).max(7),
  routine_data: AIRoutineDataSchema,
});

export type SaveRoutineDraft = z.infer<typeof SaveRoutineDraftSchema>;

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
 * 루틴 데이터 파싱 및 검증
 */
export function parseRoutineData(data: unknown): ParseResult<AIRoutineData> {
  const result = AIRoutineDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessages = result.error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  return { success: false, error: `루틴 데이터 검증 실패: ${errorMessages}` };
}

/**
 * 피트니스 프로필 업데이트 파싱 및 검증
 */
export function parseFitnessProfileUpdate(data: unknown): ParseResult<FitnessProfileUpdate> {
  const result = FitnessProfileUpdateSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessages = result.error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  return { success: false, error: `프로필 데이터 검증 실패: ${errorMessages}` };
}

/**
 * 루틴 저장 요청 파싱 및 검증
 */
export function parseSaveRoutineDraft(data: unknown): ParseResult<SaveRoutineDraft> {
  const result = SaveRoutineDraftSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessages = result.error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  return { success: false, error: `루틴 저장 데이터 검증 실패: ${errorMessages}` };
}
