'use client';

import { useRoutineEvents } from './useRoutineEvents';
import { getWeekRange, getDayOfWeek, addDays, formatDate, getToday } from '@/lib/utils/dateHelpers';
import type { RoutineEvent, EventStatus, WorkoutData } from '@/lib/types/routine';
import type { MealData } from '@/lib/types/meal';

/**
 * 주간 통계 타입
 */
export interface WeeklyStats {
  /** 운동 통계 */
  workout: {
    scheduled: number;
    completed: number;
    skipped: number;
    totalVolume: number;
    completionRate: number;
  };
  /** 식단 통계 */
  meal: {
    scheduled: number;
    completed: number;
    skipped: number;
    avgCalories: number;
    avgProtein: number;
    completionRate: number;
  };
  /** 일별 통계 */
  dailyStats: Array<{
    date: string;
    dayOfWeek: string;
    workout: EventStatus | null;
    meal: EventStatus | null;
  }>;
  /** 주간 레이블 */
  weekLabel: string;
  /** 시작일 */
  startDate: string;
  /** 종료일 */
  endDate: string;
}

/**
 * 타입 가드: WorkoutData인지 확인
 */
function isWorkoutData(data: unknown): data is WorkoutData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'exercises' in data &&
    Array.isArray((data as WorkoutData).exercises)
  );
}

/**
 * 타입 가드: MealData인지 확인
 */
function isMealData(data: unknown): data is MealData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'meals' in data &&
    Array.isArray((data as MealData).meals)
  );
}

/**
 * 운동 볼륨 계산 (세트 × 무게 × 반복)
 */
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

/**
 * 식단 영양소 계산
 */
function calculateMealNutrients(mealData: MealData): { calories: number; protein: number } {
  let calories = 0;
  let protein = 0;
  for (const meal of mealData.meals) {
    calories += meal.totalCalories ?? 0;
    protein += meal.totalProtein ?? 0;
  }
  return { calories, protein };
}

/**
 * 주간 통계 훅
 *
 * @param date - 기준 날짜 (기본값: 오늘)
 * @returns 주간 통계 데이터
 *
 * @example
 * const { data: stats, isLoading } = useWeeklyStats();
 */
export function useWeeklyStats(dateStr?: string) {
  // 날짜 문자열 기준으로 주간 범위 계산
  const baseDate = dateStr ? new Date(dateStr) : new Date();
  const { startDate, endDate, weekLabel } = getWeekRange(baseDate);

  // 주간 이벤트 조회
  const { data: events, isPending, error } = useRoutineEvents({
    startDate,
    endDate,
  });

  // 통계 계산
  const stats = ((): WeeklyStats | null => {
    if (!events) return null;

    // 운동/식단 이벤트 분리
    const workoutEvents = events.filter((e) => e.type === 'workout');
    const mealEvents = events.filter((e) => e.type === 'meal');

    // 운동 통계
    const workoutCompleted = workoutEvents.filter((e) => e.status === 'completed');
    const workoutScheduled = workoutEvents.filter((e) => e.status === 'scheduled');
    const workoutSkipped = workoutEvents.filter((e) => e.status === 'skipped');

    let totalVolume = 0;
    for (const event of workoutCompleted) {
      if (isWorkoutData(event.data)) {
        totalVolume += calculateWorkoutVolume(event.data);
      }
    }

    // 식단 통계
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

    // 일별 통계 생성
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

    // 완료율 계산
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
  })();

  return {
    data: stats,
    isPending,
    error,
  };
}
