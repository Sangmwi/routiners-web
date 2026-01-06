/**
 * AI Trainer Tool Executor
 *
 * OpenAI Function Calling 도구 실행 함수들
 * 각 도구는 사용자 컨텍스트(userId, supabase)를 받아 실행
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { AIToolName, AIToolResult, DbFitnessProfile, FitnessProfile, FitnessProfileUpdateData } from '@/lib/types';
import { transformDbFitnessProfile, transformFitnessProfileToDb } from '@/lib/types/fitness';
import { transformDbInBodyToInBody, DbInBodyRecord, InBodyRecord } from '@/lib/types/inbody';
import type { DbUser } from '@/lib/types/user';
import type { WorkoutData, WorkoutExercise, EventType } from '@/lib/types/routine';
import { parseRoutineData, type AIRoutineData, type AINotes } from './schemas';

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
}

export interface UserMilitaryInfo {
  rank: string;
  unitName: string;
  enlistmentMonth: string;
  monthsServed: number;
}

export interface UserBodyMetrics {
  height: number | null;
  weight: number | null;
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 생년월일로 나이 계산
 */
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

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

/**
 * 다음 월요일 날짜 계산
 */
function getNextMonday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=일, 1=월, ..., 6=토
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * AI routine_data(Zod 검증 완료)를 routine_events INSERT 데이터로 변환
 *
 * @param routineData - Zod 스키마로 검증된 AIRoutineData
 * @param userId - 사용자 ID
 * @param conversationId - 대화 ID (ai_session_id로 사용)
 * @param title - 루틴 제목
 */
function convertAIRoutineToEvents(
  routineData: AIRoutineData,
  userId: string,
  conversationId: string,
  title: string
): Array<{
  user_id: string;
  type: EventType;
  date: string;
  title: string;
  data: WorkoutData;
  rationale: string | null;
  status: 'scheduled';
  source: 'ai';
  ai_session_id: string;
}> {
  const events: Array<{
    user_id: string;
    type: EventType;
    date: string;
    title: string;
    data: WorkoutData;
    rationale: string | null;
    status: 'scheduled';
    source: 'ai';
    ai_session_id: string;
  }> = [];

  const startDate = getNextMonday();

  routineData.weeks.forEach((week, weekIndex) => {
    const weekDays = week.days || [];

    weekDays.forEach((day) => {
      // dayOfWeek: 1=월요일 → 0, 2=화요일 → 1, ...
      const dayOffset = (day.dayOfWeek - 1) + (weekIndex * 7);
      const eventDate = new Date(startDate);
      eventDate.setDate(startDate.getDate() + dayOffset);

      // WorkoutExercise[] 변환
      const exercises: WorkoutExercise[] = (day.exercises || []).map((ex, idx) => ({
        id: ex.id || `exercise-${idx}`,
        name: ex.name,
        category: ex.category as WorkoutExercise['category'],
        targetMuscle: ex.targetMuscle,
        sets: (ex.sets || []).map((set, setIdx) => ({
          setNumber: set.setNumber || setIdx + 1,
          targetReps: set.targetReps,
          targetWeight: set.targetWeight,
          restSeconds: set.restSeconds,
        })),
        restSeconds: ex.restSeconds,
        tempo: ex.tempo,
        rir: ex.rir,
        technique: ex.technique,
        notes: ex.notes,
      }));

      // WorkoutData 구성
      const workoutData: WorkoutData = {
        exercises,
        estimatedDuration: day.estimatedDuration,
        workoutType: day.workoutType as WorkoutData['workoutType'],
        intensity: day.intensity,
        warmup: day.warmup,
        cooldown: day.cooldown,
        tips: day.tips,
        notes: day.notes,
      };

      events.push({
        user_id: userId,
        type: 'workout',
        date: formatDate(eventDate),
        title: day.title || `${title} - Week ${weekIndex + 1} Day ${day.dayOfWeek}`,
        data: workoutData,
        rationale: day.rationale || null,
        status: 'scheduled',
        source: 'ai',
        ai_session_id: conversationId,
      });
    });
  });

  return events;
}

// ============================================================================
// Tool Executors
// ============================================================================

/**
 * 1. get_user_basic_info
 */
export async function executeGetUserBasicInfo(
  ctx: ToolExecutorContext
): Promise<AIToolResult<UserBasicInfo>> {
  const { data: user, error } = await ctx.supabase
    .from('users')
    .select('real_name, birth_date, gender')
    .eq('id', ctx.userId)
    .single();

  if (error || !user) {
    return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
  }

  return {
    success: true,
    data: {
      name: user.real_name,
      age: calculateAge(user.birth_date),
      gender: user.gender as 'male' | 'female',
    },
  };
}

/**
 * 2. get_user_military_info
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
 * 3. get_user_body_metrics
 */
export async function executeGetUserBodyMetrics(
  ctx: ToolExecutorContext
): Promise<AIToolResult<UserBodyMetrics>> {
  const { data: user, error } = await ctx.supabase
    .from('users')
    .select('height_cm, weight_kg')
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
    },
  };
}

/**
 * 4. get_latest_inbody
 */
export async function executeGetLatestInbody(
  ctx: ToolExecutorContext
): Promise<AIToolResult<InBodyRecord | null>> {
  const { data, error } = await ctx.supabase
    .from('inbody_records')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('measured_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: true, data: null };
    }
    return { success: false, error: '인바디 기록을 조회할 수 없습니다.' };
  }

  return {
    success: true,
    data: transformDbInBodyToInBody(data as DbInBodyRecord),
  };
}

/**
 * 5. get_inbody_history
 */
export async function executeGetInbodyHistory(
  ctx: ToolExecutorContext,
  args: { limit: number | null }
): Promise<AIToolResult<InBodyRecord[]>> {
  const limit = args.limit ?? 5;

  const { data, error } = await ctx.supabase
    .from('inbody_records')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('measured_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: '인바디 이력을 조회할 수 없습니다.' };
  }

  return {
    success: true,
    data: (data as DbInBodyRecord[]).map(transformDbInBodyToInBody),
  };
}

/**
 * 6. get_fitness_goal
 */
export async function executeGetFitnessGoal(
  ctx: ToolExecutorContext
): Promise<AIToolResult<{ fitnessGoal: string | null }>> {
  const { data, error } = await ctx.supabase
    .from('fitness_profiles')
    .select('fitness_goal')
    .eq('user_id', ctx.userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: true, data: { fitnessGoal: null } };
    }
    return { success: false, error: '피트니스 프로필을 조회할 수 없습니다.' };
  }

  return {
    success: true,
    data: { fitnessGoal: data.fitness_goal },
  };
}

/**
 * 7. get_experience_level
 */
export async function executeGetExperienceLevel(
  ctx: ToolExecutorContext
): Promise<AIToolResult<{ experienceLevel: string | null }>> {
  const { data, error } = await ctx.supabase
    .from('fitness_profiles')
    .select('experience_level')
    .eq('user_id', ctx.userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: true, data: { experienceLevel: null } };
    }
    return { success: false, error: '피트니스 프로필을 조회할 수 없습니다.' };
  }

  return {
    success: true,
    data: { experienceLevel: data.experience_level },
  };
}

/**
 * 8. get_training_preferences
 */
export async function executeGetTrainingPreferences(
  ctx: ToolExecutorContext
): Promise<AIToolResult<TrainingPreferences>> {
  const { data, error } = await ctx.supabase
    .from('fitness_profiles')
    .select('preferred_days_per_week, session_duration_minutes, equipment_access, focus_areas, preferences')
    .eq('user_id', ctx.userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        success: true,
        data: {
          preferredDaysPerWeek: null,
          sessionDurationMinutes: null,
          equipmentAccess: null,
          focusAreas: [],
          preferences: [],
        },
      };
    }
    return { success: false, error: '피트니스 프로필을 조회할 수 없습니다.' };
  }

  return {
    success: true,
    data: {
      preferredDaysPerWeek: data.preferred_days_per_week,
      sessionDurationMinutes: data.session_duration_minutes,
      equipmentAccess: data.equipment_access,
      focusAreas: data.focus_areas ?? [],
      preferences: data.preferences ?? [],
    },
  };
}

/**
 * 9. get_injuries_restrictions
 */
export async function executeGetInjuriesRestrictions(
  ctx: ToolExecutorContext
): Promise<AIToolResult<InjuriesRestrictions>> {
  const { data, error } = await ctx.supabase
    .from('fitness_profiles')
    .select('injuries, restrictions')
    .eq('user_id', ctx.userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        success: true,
        data: { injuries: [], restrictions: [] },
      };
    }
    return { success: false, error: '피트니스 프로필을 조회할 수 없습니다.' };
  }

  return {
    success: true,
    data: {
      injuries: data.injuries ?? [],
      restrictions: data.restrictions ?? [],
    },
  };
}

/**
 * 10. update_fitness_profile
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
  if (args.preferred_days_per_week !== null) updateData.preferred_days_per_week = args.preferred_days_per_week;
  if (args.session_duration_minutes !== null) updateData.session_duration_minutes = args.session_duration_minutes;
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
    return { success: false, error: '프로필 업데이트에 실패했습니다.' };
  }

  return { success: true, data: { updated: true } };
}

/**
 * 11. get_current_routine
 */
export async function executeGetCurrentRoutine(
  ctx: ToolExecutorContext
): Promise<AIToolResult<unknown | null>> {
  // TODO: routines 테이블 구현 후 활성화
  // 현재는 null 반환
  return {
    success: true,
    data: null,
  };
}

/**
 * 12. save_routine_draft
 *
 * AI가 생성한 루틴을 routine_events 테이블에 실제로 저장
 * 성공 시 conversations.ai_result_applied = true 업데이트
 */
export async function executeSaveRoutineDraft(
  ctx: ToolExecutorContext,
  args: {
    title: string;
    description: string;
    duration_weeks: number;
    days_per_week: number;
    routine_data: Record<string, unknown>; // object 타입으로 직접 전달
  }
): Promise<AIToolResult<{ saved: boolean; eventsCreated: number; startDate: string }>> {
  try {
    // 0. Zod 스키마로 routine_data 검증
    const parseResult = parseRoutineData(args.routine_data);
    if (!parseResult.success) {
      return { success: false, error: parseResult.error };
    }
    const validatedRoutineData = parseResult.data;

    // 1. AI routine_data를 routine_events INSERT 데이터로 변환
    const events = convertAIRoutineToEvents(
      validatedRoutineData,
      ctx.userId,
      ctx.conversationId,
      args.title
    );

    if (events.length === 0) {
      return { success: false, error: '루틴 데이터가 비어있습니다.' };
    }

    // 2. 기존 이벤트와 충돌 확인 (같은 날짜에 같은 타입)
    const dates = events.map((e) => e.date);
    const { data: existingEvents } = await ctx.supabase
      .from('routine_events')
      .select('date, type')
      .eq('user_id', ctx.userId)
      .in('date', dates)
      .eq('type', 'workout');

    if (existingEvents && existingEvents.length > 0) {
      const conflictDates = existingEvents.map((e) => e.date).slice(0, 3);
      return {
        success: false,
        error: `일부 날짜에 이미 루틴이 존재합니다: ${conflictDates.join(', ')}${existingEvents.length > 3 ? ' 외 ' + (existingEvents.length - 3) + '개' : ''}. 기존 루틴을 삭제 후 다시 시도해주세요.`,
      };
    }

    // 3. routine_events 일괄 삽입
    const { error: insertError } = await ctx.supabase
      .from('routine_events')
      .insert(events);

    if (insertError) {
      console.error('[save_routine_draft] Insert error:', insertError);
      return { success: false, error: '루틴 저장에 실패했습니다.' };
    }

    // 4. conversations.ai_result_applied = true 업데이트
    const { error: updateError } = await ctx.supabase
      .from('conversations')
      .update({
        ai_result_applied: true,
        ai_result_applied_at: new Date().toISOString(),
      })
      .eq('id', ctx.conversationId);

    if (updateError) {
      console.error('[save_routine_draft] Update conversation error:', updateError);
      // 루틴은 저장됐으므로 성공으로 처리
    }

    const startDate = events.length > 0 ? events[0].date : '';

    return {
      success: true,
      data: {
        saved: true,
        eventsCreated: events.length,
        startDate,
      },
    };
  } catch (err) {
    console.error('[save_routine_draft] Unexpected error:', err);
    return { success: false, error: '루틴 저장 중 오류가 발생했습니다.' };
  }
}

// ============================================================================
// Main Executor
// ============================================================================

/**
 * 도구 실행 메인 함수
 */
export async function executeTool(
  toolName: AIToolName,
  args: Record<string, unknown>,
  ctx: ToolExecutorContext
): Promise<AIToolResult> {
  switch (toolName) {
    case 'get_user_basic_info':
      return executeGetUserBasicInfo(ctx);

    case 'get_user_military_info':
      return executeGetUserMilitaryInfo(ctx);

    case 'get_user_body_metrics':
      return executeGetUserBodyMetrics(ctx);

    case 'get_latest_inbody':
      return executeGetLatestInbody(ctx);

    case 'get_inbody_history':
      return executeGetInbodyHistory(ctx, args as { limit: number | null });

    case 'get_fitness_goal':
      return executeGetFitnessGoal(ctx);

    case 'get_experience_level':
      return executeGetExperienceLevel(ctx);

    case 'get_training_preferences':
      return executeGetTrainingPreferences(ctx);

    case 'get_injuries_restrictions':
      return executeGetInjuriesRestrictions(ctx);

    case 'update_fitness_profile':
      return executeUpdateFitnessProfile(ctx, args as Parameters<typeof executeUpdateFitnessProfile>[1]);

    case 'get_current_routine':
      return executeGetCurrentRoutine(ctx);

    case 'save_routine_draft':
      return executeSaveRoutineDraft(ctx, args as Parameters<typeof executeSaveRoutineDraft>[1]);

    default:
      return { success: false, error: `알 수 없는 도구: ${toolName}` };
  }
}
