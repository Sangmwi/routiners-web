'use client';

import { EventType } from '@/lib/types/routine';
import { routineEventApi, EventListParams } from '@/lib/api/routineEvent';
import { queryKeys } from '@/lib/constants/queryKeys';
import { formatDate, addDays, getWeekRange, getMonthRange, getDayOfWeek } from '@/lib/utils/dateHelpers';
import { useBaseQuery, useConditionalQuery, useSuspenseBaseQuery } from '@/hooks/common';
import type { RoutineEvent, EventStatus, WorkoutData, WorkoutExercise } from '@/lib/types/routine';
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
    /** 완료한 운동의 실제 메트릭 */
    totalVolume: number;
    totalDuration: number;
    totalCaloriesBurned: number;
    totalDistance: number;
    /** 모든 이벤트(예정+완료)의 예상 메트릭 */
    plannedDuration: number;
    plannedCaloriesBurned: number;
    plannedVolume: number;
    plannedDistance: number;
    completionRate: number;
  };
  meal: {
    scheduled: number;
    completed: number;
    skipped: number;
    avgCalories: number;
    avgProtein: number;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    /** 모든 이벤트(예정+완료)의 예상 영양소 */
    plannedCalories: number;
    plannedProtein: number;
    completionRate: number;
  };
  dailyStats: Array<{
    date: string;
    dayOfWeek: string;
    workout: EventStatus | null;
    meal: EventStatus | null;
  }>;
  /** 하나 이상 완료한 날 수 */
  completedDays: number;
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

function calculateTotalDistance(exercises: WorkoutExercise[]): number {
  return exercises.reduce((sum, ex) => sum + (ex.distance ?? 0), 0);
}

function calculateMealNutrients(mealData: MealData): { calories: number; protein: number; carbs: number; fat: number } {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  for (const meal of mealData.meals) {
    calories += meal.totalCalories ?? 0;
    protein += meal.totalProtein ?? 0;
    carbs += meal.totalCarbs ?? 0;
    fat += meal.totalFat ?? 0;
  }
  return { calories, protein, carbs, fat };
}

function computeWeeklyStats(events: RoutineEvent[], startDate: string, endDate: string, weekLabel: string): WeeklyStats {
  const workoutEvents = events.filter((e) => e.type === 'workout');
  const mealEvents = events.filter((e) => e.type === 'meal');

  const workoutCompleted = workoutEvents.filter((e) => e.status === 'completed');
  const workoutScheduled = workoutEvents.filter((e) => e.status === 'scheduled');
  const workoutSkipped = workoutEvents.filter((e) => e.status === 'skipped');

  // 완료한 운동 실제 메트릭
  let totalVolume = 0;
  let totalDuration = 0;
  let totalCaloriesBurned = 0;
  let totalDistance = 0;
  for (const event of workoutCompleted) {
    if (isWorkoutData(event.data)) {
      totalVolume += calculateWorkoutVolume(event.data);
      totalDuration += event.data.estimatedDuration ?? 0;
      totalCaloriesBurned += event.data.estimatedCaloriesBurned ?? 0;
      totalDistance += calculateTotalDistance(event.data.exercises);
    }
  }

  // 모든 운동 이벤트(예정+완료)의 예상 메트릭
  let plannedDuration = 0;
  let plannedCaloriesBurned = 0;
  let plannedVolume = 0;
  let plannedDistance = 0;
  for (const event of workoutEvents) {
    if (event.status !== 'skipped' && isWorkoutData(event.data)) {
      plannedDuration += event.data.estimatedDuration ?? 0;
      plannedCaloriesBurned += event.data.estimatedCaloriesBurned ?? 0;
      plannedVolume += calculateWorkoutVolume(event.data);
      plannedDistance += calculateTotalDistance(event.data.exercises);
    }
  }

  const mealCompleted = mealEvents.filter((e) => e.status === 'completed');
  const mealScheduled = mealEvents.filter((e) => e.status === 'scheduled');
  const mealSkipped = mealEvents.filter((e) => e.status === 'skipped');

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let mealCount = 0;
  for (const event of mealCompleted) {
    if (isMealData(event.data)) {
      const nutrients = calculateMealNutrients(event.data);
      totalCalories += nutrients.calories;
      totalProtein += nutrients.protein;
      totalCarbs += nutrients.carbs;
      totalFat += nutrients.fat;
      mealCount++;
    }
  }

  // 모든 식단 이벤트(예정+완료)의 예상 영양소
  let plannedMealCalories = 0;
  let plannedMealProtein = 0;
  for (const event of mealEvents) {
    if (event.status !== 'skipped' && isMealData(event.data)) {
      const nutrients = calculateMealNutrients(event.data);
      plannedMealCalories += nutrients.calories;
      plannedMealProtein += nutrients.protein;
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
      totalDuration,
      totalCaloriesBurned,
      totalDistance,
      plannedDuration,
      plannedCaloriesBurned,
      plannedVolume,
      plannedDistance,
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
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat),
      plannedCalories: Math.round(plannedMealCalories),
      plannedProtein: Math.round(plannedMealProtein),
      completionRate: mealTotal > 0
        ? Math.round((mealCompleted.length / mealTotal) * 100)
        : 0,
    },
    dailyStats,
    completedDays: dailyStats.filter(d => d.workout === 'completed' || d.meal === 'completed').length,
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

// ============================================================================
// Monthly Stats (Derived Query)
// ============================================================================

/**
 * 월간 통계 타입
 */
export interface MonthlyStats {
  workout: {
    scheduled: number;
    completed: number;
    skipped: number;
    totalVolume: number;
    totalDuration: number;
    totalCaloriesBurned: number;
    totalDistance: number;
    plannedDuration: number;
    plannedCaloriesBurned: number;
    plannedVolume: number;
    plannedDistance: number;
    completionRate: number;
  };
  meal: {
    scheduled: number;
    completed: number;
    skipped: number;
    avgCalories: number;
    avgProtein: number;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    plannedCalories: number;
    plannedProtein: number;
    completionRate: number;
  };
  /** 주차별 완료율 (차트용) */
  weeklyBreakdown: Array<{
    weekLabel: string;
    workoutRate: number;
    mealRate: number;
  }>;
  /** 하나 이상 완료한 날 수 */
  completedDays: number;
  monthLabel: string;
  startDate: string;
  endDate: string;
  totalDays: number;
}

function computeMonthlyStats(
  events: RoutineEvent[],
  startDate: string,
  endDate: string,
  monthLabel: string
): MonthlyStats {
  const workoutEvents = events.filter((e) => e.type === 'workout');
  const mealEvents = events.filter((e) => e.type === 'meal');

  const workoutCompleted = workoutEvents.filter((e) => e.status === 'completed');
  const workoutScheduled = workoutEvents.filter((e) => e.status === 'scheduled');
  const workoutSkipped = workoutEvents.filter((e) => e.status === 'skipped');

  let totalVolume = 0;
  let totalDuration = 0;
  let totalCaloriesBurned = 0;
  let totalDistance = 0;
  for (const event of workoutCompleted) {
    if (isWorkoutData(event.data)) {
      totalVolume += calculateWorkoutVolume(event.data);
      totalDuration += event.data.estimatedDuration ?? 0;
      totalCaloriesBurned += event.data.estimatedCaloriesBurned ?? 0;
      totalDistance += calculateTotalDistance(event.data.exercises);
    }
  }

  let mPlannedDuration = 0;
  let mPlannedCaloriesBurned = 0;
  let mPlannedVolume = 0;
  let mPlannedDistance = 0;
  for (const event of workoutEvents) {
    if (event.status !== 'skipped' && isWorkoutData(event.data)) {
      mPlannedDuration += event.data.estimatedDuration ?? 0;
      mPlannedCaloriesBurned += event.data.estimatedCaloriesBurned ?? 0;
      mPlannedVolume += calculateWorkoutVolume(event.data);
      mPlannedDistance += calculateTotalDistance(event.data.exercises);
    }
  }

  const mealCompleted = mealEvents.filter((e) => e.status === 'completed');
  const mealScheduled = mealEvents.filter((e) => e.status === 'scheduled');
  const mealSkipped = mealEvents.filter((e) => e.status === 'skipped');

  let mTotalCalories = 0;
  let mTotalProtein = 0;
  let mTotalCarbs = 0;
  let mTotalFat = 0;
  let mealCount = 0;
  for (const event of mealCompleted) {
    if (isMealData(event.data)) {
      const nutrients = calculateMealNutrients(event.data);
      mTotalCalories += nutrients.calories;
      mTotalProtein += nutrients.protein;
      mTotalCarbs += nutrients.carbs;
      mTotalFat += nutrients.fat;
      mealCount++;
    }
  }

  let mPlannedMealCalories = 0;
  let mPlannedMealProtein = 0;
  for (const event of mealEvents) {
    if (event.status !== 'skipped' && isMealData(event.data)) {
      const nutrients = calculateMealNutrients(event.data);
      mPlannedMealCalories += nutrients.calories;
      mPlannedMealProtein += nutrients.protein;
    }
  }

  const workoutTotal = workoutEvents.length;
  const mealTotal = mealEvents.length;

  // 주차별 완료율 계산
  const weeklyBreakdown: MonthlyStats['weeklyBreakdown'] = [];
  const monthStart = new Date(startDate);
  let weekStart = monthStart;

  // 첫째 주 시작: 월의 첫 번째 월요일 (또는 1일이 월요일이 아니면 1일부터)
  while (weekStart <= new Date(endDate)) {
    const weekEnd = addDays(weekStart, 6);
    const actualEnd = weekEnd > new Date(endDate) ? new Date(endDate) : weekEnd;

    const weekStartStr = formatDate(weekStart);
    const weekEndStr = formatDate(actualEnd);

    const weekWorkouts = workoutEvents.filter(
      (e) => e.date >= weekStartStr && e.date <= weekEndStr
    );
    const weekMeals = mealEvents.filter(
      (e) => e.date >= weekStartStr && e.date <= weekEndStr
    );

    const weekWorkoutCompleted = weekWorkouts.filter((e) => e.status === 'completed').length;
    const weekMealCompleted = weekMeals.filter((e) => e.status === 'completed').length;

    const startDay = weekStart.getDate();
    const endDay = actualEnd.getDate();
    const label = `${startDay}일~${endDay}일`;

    weeklyBreakdown.push({
      weekLabel: label,
      workoutRate: weekWorkouts.length > 0
        ? Math.round((weekWorkoutCompleted / weekWorkouts.length) * 100)
        : 0,
      mealRate: weekMeals.length > 0
        ? Math.round((weekMealCompleted / weekMeals.length) * 100)
        : 0,
    });

    weekStart = addDays(weekStart, 7);
  }

  const totalDays = new Date(endDate).getDate();

  return {
    workout: {
      scheduled: workoutScheduled.length,
      completed: workoutCompleted.length,
      skipped: workoutSkipped.length,
      totalVolume,
      totalDuration,
      totalCaloriesBurned,
      totalDistance,
      plannedDuration: mPlannedDuration,
      plannedCaloriesBurned: mPlannedCaloriesBurned,
      plannedVolume: mPlannedVolume,
      plannedDistance: mPlannedDistance,
      completionRate: workoutTotal > 0
        ? Math.round((workoutCompleted.length / workoutTotal) * 100)
        : 0,
    },
    meal: {
      scheduled: mealScheduled.length,
      completed: mealCompleted.length,
      skipped: mealSkipped.length,
      avgCalories: mealCount > 0 ? Math.round(mTotalCalories / mealCount) : 0,
      avgProtein: mealCount > 0 ? Math.round(mTotalProtein / mealCount) : 0,
      totalCalories: Math.round(mTotalCalories),
      totalProtein: Math.round(mTotalProtein),
      totalCarbs: Math.round(mTotalCarbs),
      totalFat: Math.round(mTotalFat),
      plannedCalories: Math.round(mPlannedMealCalories),
      plannedProtein: Math.round(mPlannedMealProtein),
      completionRate: mealTotal > 0
        ? Math.round((mealCompleted.length / mealTotal) * 100)
        : 0,
    },
    weeklyBreakdown,
    completedDays: (() => {
      const dates = new Set<string>();
      for (const e of events) {
        if (e.status === 'completed') dates.add(e.date);
      }
      return dates.size;
    })(),
    monthLabel,
    startDate,
    endDate,
    totalDays,
  };
}

/**
 * 월간 통계 훅
 *
 * @param year - 연도
 * @param month - 월 (1-12)
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
