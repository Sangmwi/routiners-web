'use client';

import { EventType } from '@/lib/types/routine';
import { routineEventApi, EventListParams } from '@/lib/api/routineEvent';
import { queryKeys } from '@/lib/constants/queryKeys';
import { formatDate, addDays, getWeekRange, getDayOfWeek } from '@/lib/utils/dateHelpers';
import { useBaseQuery, useConditionalQuery, useSuspenseBaseQuery } from '@/hooks/common';
import type { RoutineEvent, EventStatus, WorkoutData } from '@/lib/types/routine';
import type { MealData } from '@/lib/types/meal';

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
 *
 * @example
 * function CalendarContent() {
 *   const { data: events } = useRoutineEventsSuspense({ year: 2025, month: 1 });
 *   return <CalendarGrid events={events} />;
 * }
 */
export function useRoutineEventsSuspense(params: EventListParams = {}) {
  return useSuspenseBaseQuery(
    queryKeys.routineEvent.list(params),
    () => routineEventApi.getEvents(params)
  );
}

/**
 * 특정 날짜의 이벤트 조회 (Suspense)
 *
 * @param date - 필수: 날짜 문자열 (YYYY-MM-DD)
 */
export function useRoutineEventByDateSuspense(date: string, type?: EventType) {
  return useSuspenseBaseQuery(
    queryKeys.routineEvent.byDate(date, type),
    () => routineEventApi.getEventByDate(date, type)
  );
}

/**
 * 특정 이벤트 상세 조회 (Suspense)
 *
 * @param id - 필수: 이벤트 ID
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

// ============================================================================
// Weekly Stats (Derived Query)
// ============================================================================

/**
 * 주간 통계 타입
 */
export interface WeeklyStats {
  workout: {
    scheduled: number;
    completed: number;
    skipped: number;
    totalVolume: number;
    completionRate: number;
  };
  meal: {
    scheduled: number;
    completed: number;
    skipped: number;
    avgCalories: number;
    avgProtein: number;
    completionRate: number;
  };
  dailyStats: Array<{
    date: string;
    dayOfWeek: string;
    workout: EventStatus | null;
    meal: EventStatus | null;
  }>;
  weekLabel: string;
  startDate: string;
  endDate: string;
}

// Type guards
function isWorkoutData(data: unknown): data is WorkoutData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'exercises' in data &&
    Array.isArray((data as WorkoutData).exercises)
  );
}

function isMealData(data: unknown): data is MealData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'meals' in data &&
    Array.isArray((data as MealData).meals)
  );
}

function calculateWorkoutVolume(workoutData: WorkoutData): number {
  let volume = 0;
  for (const exercise of workoutData.exercises) {
    for (const set of exercise.sets) {
      const reps = set.actualReps ?? set.targetReps;
      const weight = set.actualWeight ?? set.targetWeight ?? 0;
      volume += reps * weight;
    }
  }
  return volume;
}

function calculateMealNutrients(mealData: MealData): { calories: number; protein: number } {
  let calories = 0;
  let protein = 0;
  for (const meal of mealData.meals) {
    calories += meal.totalCalories ?? 0;
    protein += meal.totalProtein ?? 0;
  }
  return { calories, protein };
}

function computeWeeklyStats(events: RoutineEvent[], startDate: string, endDate: string, weekLabel: string): WeeklyStats {
  const workoutEvents = events.filter((e) => e.type === 'workout');
  const mealEvents = events.filter((e) => e.type === 'meal');

  const workoutCompleted = workoutEvents.filter((e) => e.status === 'completed');
  const workoutScheduled = workoutEvents.filter((e) => e.status === 'scheduled');
  const workoutSkipped = workoutEvents.filter((e) => e.status === 'skipped');

  let totalVolume = 0;
  for (const event of workoutCompleted) {
    if (isWorkoutData(event.data)) {
      totalVolume += calculateWorkoutVolume(event.data);
    }
  }

  const mealCompleted = mealEvents.filter((e) => e.status === 'completed');
  const mealScheduled = mealEvents.filter((e) => e.status === 'scheduled');
  const mealSkipped = mealEvents.filter((e) => e.status === 'skipped');

  let totalCalories = 0;
  let totalProtein = 0;
  let mealCount = 0;
  for (const event of mealCompleted) {
    if (isMealData(event.data)) {
      const nutrients = calculateMealNutrients(event.data);
      totalCalories += nutrients.calories;
      totalProtein += nutrients.protein;
      mealCount++;
    }
  }

  const dailyStats: WeeklyStats['dailyStats'] = [];
  const monday = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(monday, i);
    const dateStr = formatDate(currentDate);

    const workoutEvent = events.find(
      (e) => e.type === 'workout' && e.date === dateStr
    );
    const mealEvent = events.find(
      (e) => e.type === 'meal' && e.date === dateStr
    );

    dailyStats.push({
      date: dateStr,
      dayOfWeek: getDayOfWeek(currentDate),
      workout: workoutEvent?.status ?? null,
      meal: mealEvent?.status ?? null,
    });
  }

  const workoutTotal = workoutEvents.length;
  const mealTotal = mealEvents.length;

  return {
    workout: {
      scheduled: workoutScheduled.length,
      completed: workoutCompleted.length,
      skipped: workoutSkipped.length,
      totalVolume,
      completionRate: workoutTotal > 0
        ? Math.round((workoutCompleted.length / workoutTotal) * 100)
        : 0,
    },
    meal: {
      scheduled: mealScheduled.length,
      completed: mealCompleted.length,
      skipped: mealSkipped.length,
      avgCalories: mealCount > 0 ? Math.round(totalCalories / mealCount) : 0,
      avgProtein: mealCount > 0 ? Math.round(totalProtein / mealCount) : 0,
      completionRate: mealTotal > 0
        ? Math.round((mealCompleted.length / mealTotal) * 100)
        : 0,
    },
    dailyStats,
    weekLabel,
    startDate,
    endDate,
  };
}

/**
 * 주간 통계 훅
 *
 * @param dateStr - 기준 날짜 (기본값: 오늘)
 *
 * @example
 * const { data: stats, isPending } = useWeeklyStats();
 */
export function useWeeklyStats(dateStr?: string) {
  const baseDate = dateStr ? new Date(dateStr) : new Date();
  const { startDate, endDate, weekLabel } = getWeekRange(baseDate);

  const { data: events, isPending, error } = useRoutineEvents({
    startDate,
    endDate,
  });

  const stats = events ? computeWeeklyStats(events, startDate, endDate, weekLabel) : null;

  return {
    data: stats,
    isPending,
    error,
  };
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
