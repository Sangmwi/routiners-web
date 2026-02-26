/**
 * User Info Executors
 *
 * 사용자 기본 정보, 군 정보, 인바디 정보 조회
 */

import type { AIToolResult } from '@/lib/types';
import { calculateAge } from '../tool-utils';
import type { ToolExecutorContext, UserBasicInfo, UserMilitaryInfo, UserBodyMetrics } from './types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 입대월로 복무 개월 수 계산
 */
function calculateMonthsServed(enlistmentMonth: string): number {
  const today = new Date();
  const enlistment = new Date(enlistmentMonth + '-01');
  const months =
    (today.getFullYear() - enlistment.getFullYear()) * 12 +
    (today.getMonth() - enlistment.getMonth());
  return Math.max(0, months);
}

// ============================================================================
// Executors
// ============================================================================

/**
 * get_user_basic_info
 */
export async function executeGetUserBasicInfo(
  ctx: ToolExecutorContext
): Promise<AIToolResult<UserBasicInfo>> {
  const { data: user, error } = await ctx.supabase
    .from('users')
    .select('nickname, real_name, birth_date, gender, interested_exercise_types, is_smoker')
    .eq('id', ctx.userId)
    .single();

  if (error || !user) {
    return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
  }

  return {
    success: true,
    data: {
      // nickname 우선, 없으면 real_name 사용
      name: user.nickname || user.real_name,
      age: calculateAge(user.birth_date),
      gender: user.gender as 'male' | 'female',
      interestedExercises: user.interested_exercise_types,
      isSmoker: user.is_smoker,
    },
  };
}

/**
 * get_user_military_info
 */
export async function executeGetUserMilitaryInfo(
  ctx: ToolExecutorContext
): Promise<AIToolResult<UserMilitaryInfo>> {
  const { data: user, error } = await ctx.supabase
    .from('users')
    .select('rank, unit_name, enlistment_month')
    .eq('id', ctx.userId)
    .single();

  if (error || !user) {
    return { success: false, error: '군 정보를 찾을 수 없습니다.' };
  }

  return {
    success: true,
    data: {
      rank: user.rank,
      unitName: user.unit_name,
      enlistmentMonth: user.enlistment_month.substring(0, 7),
      monthsServed: calculateMonthsServed(user.enlistment_month),
    },
  };
}

/**
 * get_user_body_metrics
 *
 * TDEE 계산에 필요한 4개 필드 포함:
 * - height_cm, weight_kg, birth_date, gender
 * 체성분 데이터(키, 몸무게, 골격근량, 체지방률)는 최신 InBody 기록에서 조회
 */
export async function executeGetUserBodyMetrics(
  ctx: ToolExecutorContext
): Promise<AIToolResult<UserBodyMetrics>> {
  // 1. users에서 birth_date, gender만 조회
  const { data: user, error: userError } = await ctx.supabase
    .from('users')
    .select('birth_date, gender')
    .eq('id', ctx.userId)
    .single();

  if (userError || !user) {
    return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
  }

  // 2. 최신 InBody에서 체성분 데이터 조회
  const { data: inbody } = await ctx.supabase
    .from('inbody_records')
    .select('height, weight, skeletal_muscle_mass, body_fat_percentage')
    .eq('user_id', ctx.userId)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    success: true,
    data: {
      height_cm: inbody?.height ?? null,
      weight_kg: inbody?.weight ?? null,
      birth_date: user.birth_date,
      gender: user.gender as 'male' | 'female' | null,
      muscleMass: inbody?.skeletal_muscle_mass ?? null,
      bodyFatPercentage: inbody?.body_fat_percentage ?? null,
    },
  };
}
