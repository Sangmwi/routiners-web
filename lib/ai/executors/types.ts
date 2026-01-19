/**
 * AI Tool Executor Types
 *
 * 도구 실행에 필요한 공통 타입 정의
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Executor Context
// ============================================================================

export interface ToolExecutorContext {
  userId: string;
  supabase: SupabaseClient;
  conversationId: string;
}

// ============================================================================
// Tool Result Types
// ============================================================================

export interface UserBasicInfo {
  name: string;
  age: number;
  gender: 'male' | 'female';
  interestedExercises: string[] | null;
  isSmoker: boolean | null;
}

export interface UserMilitaryInfo {
  rank: string;
  unitName: string;
  enlistmentMonth: string;
  monthsServed: number;
}

export interface UserBodyMetrics {
  // 필수 신체정보 (TDEE 계산용) - 시스템 프롬프트와 필드명 일치
  height_cm: number | null;
  weight_kg: number | null;
  birth_date: string | null;
  gender: 'male' | 'female' | null;
  // 추가 신체정보
  muscleMass: number | null;
  bodyFatPercentage: number | null;
}

export interface TrainingPreferences {
  preferredDaysPerWeek: number | null;
  sessionDurationMinutes: number | null;
  equipmentAccess: string | null;
  focusAreas: string[];
  preferences: string[];
}

export interface InjuriesRestrictions {
  injuries: string[];
  restrictions: string[];
}

/**
 * 통합 피트니스 프로필 (4개 쿼리 → 1개 통합)
 * 성능 최적화: 개별 쿼리 대신 이 타입 사용 권장
 */
export interface FitnessProfile {
  // 운동 목표/경험
  fitnessGoal: string | null;
  experienceLevel: string | null;
  // 운동 선호도
  preferredDaysPerWeek: number | null;
  sessionDurationMinutes: number | null;
  equipmentAccess: string | null;
  focusAreas: string[];
  preferences: string[];
  // 부상/제한 사항
  injuries: string[];
  restrictions: string[];
}
