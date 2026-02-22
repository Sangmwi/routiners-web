/**
 * Fitness Profile Executors
 *
 * 피트니스 프로필 조회/수정
 */

import type { AIToolResult } from '@/lib/types';
import type { ToolExecutorContext, FitnessProfile } from './types';

// ============================================================================
// Executors
// ============================================================================

/**
 * get_fitness_profile (통합)
 *
 * 4개의 개별 쿼리(get_fitness_goal, get_experience_level, get_training_preferences, get_injuries_restrictions)를
 * 1개의 쿼리로 통합하여 성능 최적화 (쿼리 4회 → 1회)
 */
export async function executeGetFitnessProfile(
  ctx: ToolExecutorContext
): Promise<AIToolResult<FitnessProfile>> {
  const { data, error } = await ctx.supabase
    .from('fitness_profiles')
    .select(`
      fitness_goal,
      experience_level,
      preferred_days_per_week,
      session_duration_minutes,
      equipment_access,
      focus_areas,
      preferences,
      injuries,
      restrictions
    `)
    .eq('user_id', ctx.userId)
    .single();

  if (error) {
    // 프로필이 없는 경우 빈 값 반환 (정상 케이스)
    if (error.code === 'PGRST116') {
      return {
        success: true,
        data: {
          fitnessGoal: null,
          experienceLevel: null,
          preferredDaysPerWeek: null,
          sessionDurationMinutes: null,
          equipmentAccess: null,
          focusAreas: [],
          preferences: [],
          injuries: [],
          restrictions: [],
        },
      };
    }
    return { success: false, error: '피트니스 프로필을 조회할 수 없습니다.' };
  }

  return {
    success: true,
    data: {
      fitnessGoal: data.fitness_goal,
      experienceLevel: data.experience_level,
      preferredDaysPerWeek: data.preferred_days_per_week,
      sessionDurationMinutes: data.session_duration_minutes,
      equipmentAccess: data.equipment_access,
      focusAreas: data.focus_areas ?? [],
      preferences: data.preferences ?? [],
      injuries: data.injuries ?? [],
      restrictions: data.restrictions ?? [],
    },
  };
}

/**
 * update_fitness_profile
 */
export async function executeUpdateFitnessProfile(
  ctx: ToolExecutorContext,
  args: {
    fitness_goal: string | null;
    experience_level: string | null;
    preferred_days_per_week: number | null;
    session_duration_minutes: number | null;
    equipment_access: string | null;
    focus_areas: string[] | null;
    injuries: string[] | null;
    preferences: string[] | null;
    restrictions: string[] | null;
    ai_notes: Record<string, unknown> | null;
  }
): Promise<AIToolResult<{ updated: boolean }>> {
  // null이 아닌 값만 업데이트 데이터에 포함
  const updateData: Record<string, unknown> = {};

  if (args.fitness_goal !== null) updateData.fitness_goal = args.fitness_goal;
  if (args.experience_level !== null) updateData.experience_level = args.experience_level;
  if (args.preferred_days_per_week !== null) {
    const days = Math.round(args.preferred_days_per_week);
    if (days < 1 || days > 7) {
      return { success: false, error: 'preferred_days_per_week는 1~7 사이여야 합니다.' };
    }
    updateData.preferred_days_per_week = days;
  }
  if (args.session_duration_minutes !== null) {
    const mins = Math.round(args.session_duration_minutes);
    if (mins < 10 || mins > 180) {
      return { success: false, error: 'session_duration_minutes는 10~180 사이여야 합니다.' };
    }
    updateData.session_duration_minutes = mins;
  }
  if (args.equipment_access !== null) updateData.equipment_access = args.equipment_access;
  if (args.focus_areas !== null) updateData.focus_areas = args.focus_areas;
  if (args.injuries !== null) updateData.injuries = args.injuries;
  if (args.preferences !== null) updateData.preferences = args.preferences;
  if (args.restrictions !== null) updateData.restrictions = args.restrictions;
  if (args.ai_notes !== null) updateData.ai_notes = args.ai_notes;

  if (Object.keys(updateData).length === 0) {
    return { success: true, data: { updated: false } };
  }

  // Upsert: 없으면 생성, 있으면 업데이트
  const { error } = await ctx.supabase
    .from('fitness_profiles')
    .upsert(
      {
        user_id: ctx.userId,
        ...updateData,
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('[update_fitness_profile] Error:', error);
    console.error('[update_fitness_profile] UpdateData:', updateData);
    return { success: false, error: `프로필 업데이트에 실패했습니다: ${error.message}` };
  }

  return { success: true, data: { updated: true } };
}
