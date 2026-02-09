'use client';

import { EventType } from '@/lib/types/routine';
import { routineEventApi, EventListParams } from '@/lib/api/routineEvent';
import { queryKeys } from '@/lib/constants/queryKeys';
import { formatDate, addDays, getWeekRange, getMonthRange } from '@/lib/utils/dateHelpers';
import { useBaseQuery, useConditionalQuery, useSuspenseBaseQuery } from '@/hooks/common';
import { computeWeeklyStats, computeMonthlyStats } from '@/lib/stats/computations';

// Re-export types for downstream consumers
export type { WeeklyStats, MonthlyStats } from '@/lib/stats/computations';

// ============================================================================
// Standard Query Hooks
// ============================================================================

/**
 * 루틴 이벤트 목록 조회
 */
export function useRoutineEvents(params: EventListParams = {}) {
  return useBaseQuery(
    queryKeys.routineEvent.list(params),
    () => routineEventApi.getEvents(params)
  );
}

/**
 * 과거 + 미래 이벤트 조회 (캐러셀용)
 */
export function useUpcomingEvents(
  type: EventType,
  pastDays: number = 7,
  futureDays: number = 14
) {
  const startDate = formatDate(addDays(new Date(), -pastDays));
  const endDate = formatDate(addDays(new Date(), futureDays));

  return useRoutineEvents({ type, startDate, endDate });
}

/**
 * 특정 날짜의 이벤트 조회
 */
export function useRoutineEventByDate(date: string | undefined, type?: EventType) {
  return useConditionalQuery(
    queryKeys.routineEvent.byDate(date || '', type),
    () => routineEventApi.getEventByDate(date!, type),
    date
  );
}

/**
 * 특정 이벤트 상세 조회
 */
export function useRoutineEvent(id: string | undefined) {
  return useConditionalQuery(
    queryKeys.routineEvent.detail(id || ''),
    () => routineEventApi.getEvent(id!),
    id
  );
}

/**
 * 월별 캘린더 요약 조회
 */
export function useCalendarEvents(year: number, month: number) {
  return useBaseQuery(
    queryKeys.routineEvent.monthSummary(year, month),
    () => routineEventApi.getMonthSummary(year, month)
  );
}

// ============================================================================
// Suspense Query Hooks
// ============================================================================

/**
 * 루틴 이벤트 목록 조회 (Suspense)
 */
export function useRoutineEventsSuspense(params: EventListParams = {}) {
  return useSuspenseBaseQuery(
    queryKeys.routineEvent.list(params),
    () => routineEventApi.getEvents(params)
  );
}

/**
 * 특정 날짜의 이벤트 조회 (Suspense)
 */
export function useRoutineEventByDateSuspense(date: string, type?: EventType) {
  return useSuspenseBaseQuery(
    queryKeys.routineEvent.byDate(date, type),
    () => routineEventApi.getEventByDate(date, type)
  );
}

/**
 * 특정 이벤트 상세 조회 (Suspense)
 */
export function useRoutineEventSuspense(id: string) {
  return useSuspenseBaseQuery(
    queryKeys.routineEvent.detail(id),
    () => routineEventApi.getEvent(id)
  );
}

/**
 * 월별 캘린더 요약 조회 (Suspense)
 */
export function useCalendarEventsSuspense(year: number, month: number) {
  return useSuspenseBaseQuery(
    queryKeys.routineEvent.monthSummary(year, month),
    () => routineEventApi.getMonthSummary(year, month)
  );
}

/**
 * 과거 + 미래 이벤트 조회 (Suspense)
 */
export function useUpcomingEventsSuspense(
  type: EventType,
  pastDays: number = 7,
  futureDays: number = 14
) {
  const startDate = formatDate(addDays(new Date(), -pastDays));
  const endDate = formatDate(addDays(new Date(), futureDays));

  return useRoutineEventsSuspense({ type, startDate, endDate });
}

// ============================================================================
// Derived Stats Hooks
// ============================================================================

/**
 * 주간 통계 훅
 */
export function useWeeklyStats(dateStr?: string) {
  const baseDate = dateStr ? new Date(dateStr) : new Date();
  const { startDate, endDate, weekLabel } = getWeekRange(baseDate);

  const { data: events, isPending, error } = useRoutineEvents({
    startDate,
    endDate,
  });

  const stats = events ? computeWeeklyStats(events, startDate, endDate, weekLabel) : null;

  return { data: stats, isPending, error };
}

/**
 * 주간 통계 훅 (Suspense)
 */
export function useWeeklyStatsSuspense(dateStr?: string) {
  const baseDate = dateStr ? new Date(dateStr) : new Date();
  const { startDate, endDate, weekLabel } = getWeekRange(baseDate);

  const { data: events } = useRoutineEventsSuspense({
    startDate,
    endDate,
  });

  return computeWeeklyStats(events, startDate, endDate, weekLabel);
}

/**
 * 월간 통계 훅
 */
export function useMonthlyStats(year: number, month: number) {
  const { startDate, endDate, monthLabel } = getMonthRange(year, month);

  const { data: events, isPending, error } = useRoutineEvents({
    startDate,
    endDate,
  });

  const stats = events ? computeMonthlyStats(events, startDate, endDate, monthLabel) : null;

  return { data: stats, isPending, error };
}

/**
 * 월간 통계 훅 (Suspense)
 */
export function useMonthlyStatsSuspense(year: number, month: number) {
  const { startDate, endDate, monthLabel } = getMonthRange(year, month);

  const { data: events } = useRoutineEventsSuspense({
    startDate,
    endDate,
  });

  return computeMonthlyStats(events, startDate, endDate, monthLabel);
}
