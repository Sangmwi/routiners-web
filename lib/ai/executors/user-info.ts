/**
 * User Info Executors
 *
 * 사용자 기본 정보, 군 정보, 신체 정보 조회
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
 */
export async function executeGetUserBodyMetrics(
  ctx: ToolExecutorContext
): Promise<AIToolResult<UserBodyMetrics>> {
  const { data: user, error } = await ctx.supabase
    .from('users')
    .select('height_cm, weight_kg, skeletal_muscle_mass_kg, body_fat_percentage')
    .eq('id', ctx.userId)
    .single();

  if (error || !user) {
    return { success: false, error: '신체 정보를 찾을 수 없습니다.' };
  }

  return {
    success: true,
    data: {
      height: user.height_cm,
      weight: user.weight_kg,
      muscleMass: user.skeletal_muscle_mass_kg,
      bodyFatPercentage: user.body_fat_percentage,
    },
  };
}
