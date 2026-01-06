/**
 * Fitness Profile Types
 *
 * AI 트레이너가 사용하는 운동 프로필 관련 타입 정의
 * fitness_profiles 테이블 기반
 */

import { z } from 'zod';

// ============================================================================
// Enums & Constants
// ============================================================================

export const FITNESS_GOALS = [
  'muscle_gain',
  'fat_loss',
  'endurance',
  'general_fitness',
  'strength',
] as const;

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export const EQUIPMENT_ACCESS = ['full_gym', 'limited', 'bodyweight_only'] as const;

export const FOCUS_AREAS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'full_body',
] as const;

export type FitnessGoal = (typeof FITNESS_GOALS)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type EquipmentAccess = (typeof EQUIPMENT_ACCESS)[number];
export type FocusArea = (typeof FOCUS_AREAS)[number];

// 한국어 레이블
export const FITNESS_GOAL_LABELS: Record<FitnessGoal, string> = {
  muscle_gain: '근육 증가',
  fat_loss: '체지방 감소',
  endurance: '지구력 향상',
  general_fitness: '전반적인 체력 향상',
  strength: '근력 강화',
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: '초보자',
  intermediate: '중급자',
  advanced: '상급자',
};

export const EQUIPMENT_ACCESS_LABELS: Record<EquipmentAccess, string> = {
  full_gym: '헬스장 (모든 장비)',
  limited: '제한적 장비',
  bodyweight_only: '맨몸 운동만',
};

export const FOCUS_AREA_LABELS: Record<FocusArea, string> = {
  chest: '가슴',
  back: '등',
  shoulders: '어깨',
  arms: '팔',
  legs: '하체',
  core: '코어',
  full_body: '전신',
};

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * FitnessProfile 검증용 Zod 스키마
 */
export const FitnessProfileSchema = z.object({
  fitnessGoal: z.enum(FITNESS_GOALS).nullable(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).nullable(),
  preferredDaysPerWeek: z.number().int().min(1).max(7).nullable(),
  sessionDurationMinutes: z.number().int().min(10).max(180).nullable(),
  equipmentAccess: z.enum(EQUIPMENT_ACCESS).nullable(),
  focusAreas: z.array(z.enum(FOCUS_AREAS)).default([]),
  injuries: z.array(z.string()).default([]),
  preferences: z.array(z.string()).default([]),
  restrictions: z.array(z.string()).default([]),
  aiNotes: z.record(z.unknown()).default({}),
});

/**
 * FitnessProfile 생성/수정용 스키마 (모든 필드 optional)
 */
export const FitnessProfileUpdateSchema = FitnessProfileSchema.partial();

// ============================================================================
// Database Types (snake_case - DB 직접 사용용)
// ============================================================================

/**
 * DB fitness_profiles 테이블 Row 타입
 */
export interface DbFitnessProfile {
  user_id: string;
  fitness_goal: FitnessGoal | null;
  experience_level: ExperienceLevel | null;
  preferred_days_per_week: number | null;
  session_duration_minutes: number | null;
  equipment_access: EquipmentAccess | null;
  focus_areas: FocusArea[];
  injuries: string[];
  preferences: string[];
  restrictions: string[];
  ai_notes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Domain Types (camelCase - 클라이언트 사용용)
// ============================================================================

/**
 * 클라이언트용 FitnessProfile 타입
 */
export interface FitnessProfile {
  userId: string;
  fitnessGoal?: FitnessGoal;
  experienceLevel?: ExperienceLevel;
  preferredDaysPerWeek?: number;
  sessionDurationMinutes?: number;
  equipmentAccess?: EquipmentAccess;
  focusAreas: FocusArea[];
  injuries: string[];
  preferences: string[];
  restrictions: string[];
  aiNotes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * FitnessProfile 생성/수정용 데이터
 */
export interface FitnessProfileUpdateData {
  fitnessGoal?: FitnessGoal | null;
  experienceLevel?: ExperienceLevel | null;
  preferredDaysPerWeek?: number | null;
  sessionDurationMinutes?: number | null;
  equipmentAccess?: EquipmentAccess | null;
  focusAreas?: FocusArea[];
  injuries?: string[];
  preferences?: string[];
  restrictions?: string[];
  aiNotes?: Record<string, unknown>;
}

// ============================================================================
// Type Transformers
// ============================================================================

/**
 * DbFitnessProfile → FitnessProfile 변환
 */
export function transformDbFitnessProfile(db: DbFitnessProfile): FitnessProfile {
  return {
    userId: db.user_id,
    fitnessGoal: db.fitness_goal ?? undefined,
    experienceLevel: db.experience_level ?? undefined,
    preferredDaysPerWeek: db.preferred_days_per_week ?? undefined,
    sessionDurationMinutes: db.session_duration_minutes ?? undefined,
    equipmentAccess: db.equipment_access ?? undefined,
    focusAreas: db.focus_areas ?? [],
    injuries: db.injuries ?? [],
    preferences: db.preferences ?? [],
    restrictions: db.restrictions ?? [],
    aiNotes: db.ai_notes ?? {},
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * FitnessProfileUpdateData → DB Insert/Update 데이터 변환
 */
export function transformFitnessProfileToDb(
  data: FitnessProfileUpdateData
): Partial<Omit<DbFitnessProfile, 'user_id' | 'created_at' | 'updated_at'>> {
  const result: Partial<Omit<DbFitnessProfile, 'user_id' | 'created_at' | 'updated_at'>> = {};

  if (data.fitnessGoal !== undefined) result.fitness_goal = data.fitnessGoal;
  if (data.experienceLevel !== undefined) result.experience_level = data.experienceLevel;
  if (data.preferredDaysPerWeek !== undefined) result.preferred_days_per_week = data.preferredDaysPerWeek;
  if (data.sessionDurationMinutes !== undefined) result.session_duration_minutes = data.sessionDurationMinutes;
  if (data.equipmentAccess !== undefined) result.equipment_access = data.equipmentAccess;
  if (data.focusAreas !== undefined) result.focus_areas = data.focusAreas;
  if (data.injuries !== undefined) result.injuries = data.injuries;
  if (data.preferences !== undefined) result.preferences = data.preferences;
  if (data.restrictions !== undefined) result.restrictions = data.restrictions;
  if (data.aiNotes !== undefined) result.ai_notes = data.aiNotes;

  return result;
}

// ============================================================================
// AI Tool Types (Function Calling용)
// ============================================================================

/**
 * AI 도구 이름 목록
 */
export const AI_TOOL_NAMES = [
  // 사용자 기본 정보
  'get_user_basic_info',
  'get_user_military_info',
  // 신체 정보
  'get_user_body_metrics',
  'get_latest_inbody',
  'get_inbody_history',
  // 피트니스 프로필
  'get_fitness_goal',
  'get_experience_level',
  'get_training_preferences',
  'get_injuries_restrictions',
  // 프로필 업데이트
  'update_fitness_profile',
  // 루틴 관련
  'get_current_routine',
  'save_routine_draft',
] as const;

export type AIToolName = (typeof AI_TOOL_NAMES)[number];

/**
 * AI 도구 한국어 레이블 (로딩 상태 표시용)
 */
export const AI_TOOL_LABELS: Record<AIToolName, string> = {
  get_user_basic_info: '기본 정보 확인 중',
  get_user_military_info: '군 정보 확인 중',
  get_user_body_metrics: '신체 정보 확인 중',
  get_latest_inbody: '최근 인바디 확인 중',
  get_inbody_history: '인바디 이력 확인 중',
  get_fitness_goal: '운동 목표 확인 중',
  get_experience_level: '운동 경험 확인 중',
  get_training_preferences: '운동 선호도 확인 중',
  get_injuries_restrictions: '부상/제한 사항 확인 중',
  update_fitness_profile: '프로필 업데이트 중',
  get_current_routine: '현재 루틴 확인 중',
  save_routine_draft: '루틴 초안 저장 중',
};

/**
 * AI 도구 실행 결과
 */
export interface AIToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * AI 도구 호출 정보 (SSE 이벤트용)
 */
export interface AIToolCall {
  id: string;
  name: AIToolName;
  arguments: Record<string, unknown>;
}

/**
 * AI 도구 실행 상태 (UI용)
 */
export interface AIToolStatus {
  toolCallId: string;
  name: AIToolName;
  status: 'running' | 'completed' | 'error';
  result?: unknown;
  error?: string;
}
