/**
 * Routine Server API Layer
 *
 * 서버 컴포넌트용 루틴 이벤트 데이터 페칭
 * - Supabase 직접 접근 (API Route 사용 안 함)
 * - SSR prefetch에서 사용
 */

import { createClient } from '@/utils/supabase/server';
import {
  toRoutineEvent,
  type RoutineEvent,
  type DbRoutineEvent,
  type EventType,
} from '@/lib/types/routine';
import { formatDate, addDays } from '@/lib/utils/dateHelpers';

/**
 * 루틴 이벤트 목록 조회 (서버 사이드)
 */
export async function fetchRoutineEventsServer(params: {
  type?: EventType;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<RoutineEvent[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from('routine_events')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  if (params.type) {
    query = query.eq('type', params.type);
  }

  if (params.startDate) {
    query = query.gte('date', params.startDate);
  }

  if (params.endDate) {
    query = query.lte('date', params.endDate);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[fetchRoutineEventsServer] Error:', error);
    return [];
  }

  return (data ?? []).map((db) => toRoutineEvent(db as DbRoutineEvent));
}

/**
 * 과거 + 미래 이벤트 조회 (캐러셀용, 서버 사이드)
 */
export async function fetchUpcomingEventsServer(
  type: EventType,
  pastDays: number = 7,
  futureDays: number = 14
): Promise<RoutineEvent[]> {
  const startDate = formatDate(addDays(new Date(), -pastDays));
  const endDate = formatDate(addDays(new Date(), futureDays));

  return fetchRoutineEventsServer({ type, startDate, endDate });
}

/**
 * 특정 날짜의 이벤트 조회 (서버 사이드)
 */
export async function fetchRoutineEventByDateServer(
  date: string,
  type?: EventType
): Promise<RoutineEvent | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  let query = supabase
    .from('routine_events')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    console.error('[fetchRoutineEventByDateServer] Error:', error);
    return null;
  }

  return data ? toRoutineEvent(data as DbRoutineEvent) : null;
}

/**
 * 월별 캘린더 요약 조회 (서버 사이드)
 */
export async function fetchMonthSummaryServer(
  year: number,
  month: number
): Promise<RoutineEvent[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  return fetchRoutineEventsServer({ startDate, endDate });
}
