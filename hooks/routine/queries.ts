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
// Query Config Factories (queryKey + queryFn 공유 — Suspense/non-Suspense 중복 제거)
// ============================================================================

function routineEventsConfig(params: EventListParams) {
  return {
    queryKey: queryKeys.routineEvent.list(params),
    queryFn: () => routineEventApi.getEvents(params),
  };
}

function routineEventByDateConfig(date: string, type?: EventType) {
  return {
    queryKey: queryKeys.routineEvent.byDate(date, type),
    queryFn: () => routineEventApi.getEventByDate(date, type),
  };
}

function routineEventConfig(id: string) {
  return {
    queryKey: queryKeys.routineEvent.detail(id),
    queryFn: () => routineEventApi.getEvent(id),
  };
}

function calendarEventsConfig(year: number, month: number) {
  return {
    queryKey: queryKeys.routineEvent.monthSummary(year, month),
    queryFn: () => routineEventApi.getMonthSummary(year, month),
  };
}

// ============================================================================
// Standard Query Hooks
// ============================================================================

/**
 * 루틴 이벤트 목록 조회
 */
export function useRoutineEvents(params: EventListParams = {}) {
  const { queryKey, queryFn } = routineEventsConfig(params);
  return useBaseQuery(queryKey, queryFn);
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
  const { queryKey, queryFn } = calendarEventsConfig(year, month);
  return useBaseQuery(queryKey, queryFn);
}

// ============================================================================
// Suspense Query Hooks
// ============================================================================

/**
 * 루틴 이벤트 목록 조회 (Suspense)
 */
export function useRoutineEventsSuspense(params: EventListParams = {}) {
  const { queryKey, queryFn } = routineEventsConfig(params);
  return useSuspenseBaseQuery(queryKey, queryFn);
}

/**
 * 특정 날짜의 이벤트 조회 (Suspense)
 */
export function useRoutineEventByDateSuspense(date: string, type?: EventType) {
  const { queryKey, queryFn } = routineEventByDateConfig(date, type);
  return useSuspenseBaseQuery(queryKey, queryFn);
}

/**
 * 특정 이벤트 상세 조회 (Suspense)
 */
export function useRoutineEventSuspense(id: string) {
  const { queryKey, queryFn } = routineEventConfig(id);
  return useSuspenseBaseQuery(queryKey, queryFn);
}

/**
 * 월별 캘린더 요약 조회 (Suspense)
 */
export function useCalendarEventsSuspense(year: number, month: number) {
  const { queryKey, queryFn } = calendarEventsConfig(year, month);
  return useSuspenseBaseQuery(queryKey, queryFn);
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

/**
 * 다음 예정된 운동 조회 (Suspense)
 *
 * 쉬는날 vs 미등록 상태 구분용
 * 내일~30일 후 범위에서 scheduled 운동 1건만 조회
 */
export function useNextScheduledWorkoutSuspense() {
  const tomorrow = formatDate(addDays(new Date(), 1));
  const futureLimit = formatDate(addDays(new Date(), 30));
  const params: EventListParams = {
    startDate: tomorrow,
    endDate: futureLimit,
    type: 'workout',
    status: 'scheduled',
    limit: 1,
  };

  const { data: events, ...rest } = useSuspenseBaseQuery(
    queryKeys.routineEvent.list(params),
    () => routineEventApi.getEvents(params)
  );

  return { data: events[0] ?? null, ...rest };
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
