/**
 * Shared Executors
 *
 * InBody 기록, 현재 루틴 등 공통 도구
 */

import type { AIToolResult } from '@/lib/types';
import { toInBodyRecord, DbInBodyRecord, InBodyRecord } from '@/lib/types/inbody';
import { formatDate } from '@/lib/ai/tool-utils';
import type { ToolExecutorContext } from './types';

// ============================================================================
// Types (get_current_routine 응답)
// ============================================================================

interface CurrentRoutineExerciseSummary {
  id: string;
  name: string;
  setsCount: number;
}

interface CurrentRoutineEvent {
  id: string;
  date: string;
  title: string;
  status: string;
  exercises: CurrentRoutineExerciseSummary[];
}

interface CurrentRoutineData {
  scheduledCount: number;
  completedCount: number;
  skippedCount: number;
  lastScheduledDate: string | null;
  events: CurrentRoutineEvent[];
}

// ============================================================================
// Executors
// ============================================================================

/**
 * get_latest_inbody
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
    data: toInBodyRecord(data as DbInBodyRecord),
  };
}

/**
 * get_inbody_history
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
    data: (data as DbInBodyRecord[]).map(toInBodyRecord),
  };
}

/**
 * get_current_routine
 *
 * 유저의 현재 routine_events 조회 (세션 무관)
 * - 향후 scheduled 이벤트 전체
 * - 최근 2주 completed/skipped 이벤트
 * - AI가 기존 루틴을 참고하여 수정/재생성 가능
 */
export async function executeGetCurrentRoutine(
  ctx: ToolExecutorContext
): Promise<AIToolResult<CurrentRoutineData | null>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);

  const { data: events, error } = await ctx.supabase
    .from('routine_events')
    .select('id, date, title, status, data')
    .eq('user_id', ctx.userId)
    .eq('type', 'workout')
    .gte('date', formatDate(twoWeeksAgo))
    .order('date', { ascending: true })
    .limit(40);

  if (error) {
    return { success: false, error: '루틴 이벤트를 조회할 수 없습니다.' };
  }

  if (!events || events.length === 0) {
    return { success: true, data: null };
  }

  // 상태별 카운트 및 마지막 스케줄 날짜 계산
  let scheduledCount = 0;
  let completedCount = 0;
  let skippedCount = 0;
  let lastScheduledDate: string | null = null;

  const mappedEvents: CurrentRoutineEvent[] = events.map((e) => {
    if (e.status === 'scheduled') {
      scheduledCount++;
      lastScheduledDate = e.date;
    } else if (e.status === 'completed') {
      completedCount++;
    } else if (e.status === 'skipped') {
      skippedCount++;
    }

    // data에서 운동 ID, 이름, 세트 수 추출 (편집 도구에서 참조 가능)
    const workoutData = e.data as { exercises?: Array<{ id: string; name: string; sets?: unknown[] }> } | null;
    const exercises: CurrentRoutineExerciseSummary[] = workoutData?.exercises?.map((ex) => ({
      id: ex.id,
      name: ex.name,
      setsCount: ex.sets?.length ?? 0,
    })) ?? [];

    return {
      id: e.id,
      date: e.date,
      title: e.title,
      status: e.status,
      exercises,
    };
  });

  return {
    success: true,
    data: {
      scheduledCount,
      completedCount,
      skippedCount,
      lastScheduledDate,
      events: mappedEvents,
    },
  };
}
