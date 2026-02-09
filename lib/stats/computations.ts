import type { RoutineEvent, WorkoutData, WorkoutExercise, EventStatus } from '@/lib/types/routine';
import type { MealData } from '@/lib/types/meal';
import { isWorkoutData, isMealData } from '@/lib/types/guards';
import { formatDate, addDays, getDayOfWeek } from '@/lib/utils/dateHelpers';

// ============================================================================
// Helper Functions
// ============================================================================

export function calculateWorkoutVolume(workoutData: WorkoutData): number {
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

export function calculateTotalDistance(exercises: WorkoutExercise[]): number {
  return exercises.reduce((sum, ex) => sum + (ex.distance ?? 0), 0);
}

export function calculateMealNutrients(mealData: MealData): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
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

// ============================================================================
// Shared Aggregation
// ============================================================================

interface WorkoutMetrics {
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
}

interface MealMetrics {
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
}

/**
 * 이벤트 목록에서 운동/식단 공통 메트릭 집계
 */
function aggregateEventMetrics(events: RoutineEvent[]): {
  workout: WorkoutMetrics;
  meal: MealMetrics;
} {
  const workoutEvents = events.filter((e) => e.type === 'workout');
  const mealEvents = events.filter((e) => e.type === 'meal');

  const workoutCompleted = workoutEvents.filter((e) => e.status === 'completed');
  const workoutScheduled = workoutEvents.filter((e) => e.status === 'scheduled');
  const workoutSkipped = workoutEvents.filter((e) => e.status === 'skipped');

  // 완료 운동 실제 메트릭
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

  // 예정+완료 예상 메트릭
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

  const workoutTotal = workoutEvents.length;

  // 식단 메트릭
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

  let plannedMealCalories = 0;
  let plannedMealProtein = 0;
  for (const event of mealEvents) {
    if (event.status !== 'skipped' && isMealData(event.data)) {
      const nutrients = calculateMealNutrients(event.data);
      plannedMealCalories += nutrients.calories;
      plannedMealProtein += nutrients.protein;
    }
  }

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
      avgCalories: mealCount > 0 ? Math.round(mTotalCalories / mealCount) : 0,
      avgProtein: mealCount > 0 ? Math.round(mTotalProtein / mealCount) : 0,
      totalCalories: Math.round(mTotalCalories),
      totalProtein: Math.round(mTotalProtein),
      totalCarbs: Math.round(mTotalCarbs),
      totalFat: Math.round(mTotalFat),
      plannedCalories: Math.round(plannedMealCalories),
      plannedProtein: Math.round(plannedMealProtein),
      completionRate: mealTotal > 0
        ? Math.round((mealCompleted.length / mealTotal) * 100)
        : 0,
    },
  };
}

// ============================================================================
// Weekly Stats
// ============================================================================

export interface WeeklyStats {
  workout: WorkoutMetrics;
  meal: MealMetrics;
  dailyStats: Array<{
    date: string;
    dayOfWeek: string;
    workout: EventStatus | null;
    meal: EventStatus | null;
  }>;
  completedDays: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
}

export function computeWeeklyStats(
  events: RoutineEvent[],
  startDate: string,
  endDate: string,
  weekLabel: string,
): WeeklyStats {
  const metrics = aggregateEventMetrics(events);

  const dailyStats: WeeklyStats['dailyStats'] = [];
  const monday = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(monday, i);
    const dateStr = formatDate(currentDate);

    const workoutEvent = events.find(
      (e) => e.type === 'workout' && e.date === dateStr,
    );
    const mealEvent = events.find(
      (e) => e.type === 'meal' && e.date === dateStr,
    );

    dailyStats.push({
      date: dateStr,
      dayOfWeek: getDayOfWeek(currentDate),
      workout: workoutEvent?.status ?? null,
      meal: mealEvent?.status ?? null,
    });
  }

  return {
    ...metrics,
    dailyStats,
    completedDays: dailyStats.filter(
      (d) => d.workout === 'completed' || d.meal === 'completed',
    ).length,
    weekLabel,
    startDate,
    endDate,
  };
}

// ============================================================================
// Monthly Stats
// ============================================================================

export interface MonthlyStats {
  workout: WorkoutMetrics;
  meal: MealMetrics;
  weeklyBreakdown: Array<{
    weekLabel: string;
    workoutRate: number;
    mealRate: number;
  }>;
  completedDays: number;
  monthLabel: string;
  startDate: string;
  endDate: string;
  totalDays: number;
}

export function computeMonthlyStats(
  events: RoutineEvent[],
  startDate: string,
  endDate: string,
  monthLabel: string,
): MonthlyStats {
  const metrics = aggregateEventMetrics(events);

  const workoutEvents = events.filter((e) => e.type === 'workout');
  const mealEvents = events.filter((e) => e.type === 'meal');

  // 주차별 완료율
  const weeklyBreakdown: MonthlyStats['weeklyBreakdown'] = [];
  let weekStart = new Date(startDate);

  while (weekStart <= new Date(endDate)) {
    const weekEnd = addDays(weekStart, 6);
    const actualEnd = weekEnd > new Date(endDate) ? new Date(endDate) : weekEnd;

    const weekStartStr = formatDate(weekStart);
    const weekEndStr = formatDate(actualEnd);

    const weekWorkouts = workoutEvents.filter(
      (e) => e.date >= weekStartStr && e.date <= weekEndStr,
    );
    const weekMeals = mealEvents.filter(
      (e) => e.date >= weekStartStr && e.date <= weekEndStr,
    );

    const weekWorkoutCompleted = weekWorkouts.filter(
      (e) => e.status === 'completed',
    ).length;
    const weekMealCompleted = weekMeals.filter(
      (e) => e.status === 'completed',
    ).length;

    const startDay = weekStart.getDate();
    const endDay = actualEnd.getDate();

    weeklyBreakdown.push({
      weekLabel: `${startDay}일~${endDay}일`,
      workoutRate:
        weekWorkouts.length > 0
          ? Math.round((weekWorkoutCompleted / weekWorkouts.length) * 100)
          : 0,
      mealRate:
        weekMeals.length > 0
          ? Math.round((weekMealCompleted / weekMeals.length) * 100)
          : 0,
    });

    weekStart = addDays(weekStart, 7);
  }

  const totalDays = new Date(endDate).getDate();

  return {
    ...metrics,
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
