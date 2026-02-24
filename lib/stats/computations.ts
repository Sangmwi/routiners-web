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
  totalVolume: number;
  totalDuration: number;
  totalCaloriesBurned: number;
  totalDistance: number;
  plannedDuration: number;
  plannedCaloriesBurned: number;
  plannedVolume: number;
  plannedDistance: number;
  totalSets: number;
  plannedSets: number;
  completionRate: number;
}

export interface MealMetrics {
  scheduled: number;
  completed: number;
  avgCalories: number;
  avgProtein: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  plannedCalories: number;
  plannedProtein: number;
  completionRate: number;
  /** 이벤트별 targetCalories 합산 */
  targetCalories: number;
  /** 이벤트별 targetProtein 합산 */
  targetProtein: number;
  /** 일 평균 목표 칼로리 */
  avgTargetCalories: number;
  /** target 데이터가 있는 이벤트 수 */
  daysWithTargets: number;
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

  // 완료 운동 실제 메트릭
  let totalVolume = 0;
  let totalDuration = 0;
  let totalCaloriesBurned = 0;
  let totalDistance = 0;
  let totalSets = 0;
  for (const event of workoutCompleted) {
    if (isWorkoutData(event.data)) {
      totalVolume += calculateWorkoutVolume(event.data);
      // 실측 시간(elapsedSeconds) 우선, 없으면 예상 시간
      const durationMin = event.data.elapsedSeconds
        ? Math.round(event.data.elapsedSeconds / 60)
        : (event.data.estimatedDuration ?? 0);
      totalDuration += durationMin;
      totalCaloriesBurned += event.data.estimatedCaloriesBurned ?? 0;
      totalDistance += calculateTotalDistance(event.data.exercises);
      totalSets += event.data.exercises.reduce((s, ex) => s + ex.sets.length, 0);
    }
  }

  // 예정+완료 예상 메트릭
  let plannedDuration = 0;
  let plannedCaloriesBurned = 0;
  let plannedVolume = 0;
  let plannedDistance = 0;
  let plannedSets = 0;
  for (const event of workoutEvents) {
    if (isWorkoutData(event.data)) {
      plannedDuration += event.data.estimatedDuration ?? 0;
      plannedCaloriesBurned += event.data.estimatedCaloriesBurned ?? 0;
      plannedVolume += calculateWorkoutVolume(event.data);
      plannedDistance += calculateTotalDistance(event.data.exercises);
      plannedSets += event.data.exercises.reduce((s, ex) => s + ex.sets.length, 0);
    }
  }

  const workoutTotal = workoutEvents.length;

  // 식단 메트릭
  const mealCompleted = mealEvents.filter((e) => e.status === 'completed');
  const mealScheduled = mealEvents.filter((e) => e.status === 'scheduled');

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
  let mTargetCalories = 0;
  let mTargetProtein = 0;
  let daysWithTargets = 0;
  for (const event of mealEvents) {
    if (isMealData(event.data)) {
      const nutrients = calculateMealNutrients(event.data);
      plannedMealCalories += nutrients.calories;
      plannedMealProtein += nutrients.protein;
      if (event.data.targetCalories) {
        mTargetCalories += event.data.targetCalories;
        daysWithTargets++;
      }
      if (event.data.targetProtein) {
        mTargetProtein += event.data.targetProtein;
      }
    }
  }

  const mealTotal = mealEvents.length;

  return {
    workout: {
      scheduled: workoutScheduled.length,
      completed: workoutCompleted.length,
      totalVolume,
      totalDuration,
      totalCaloriesBurned,
      totalDistance,
      totalSets,
      plannedDuration,
      plannedCaloriesBurned,
      plannedVolume,
      plannedDistance,
      plannedSets,
      completionRate: workoutTotal > 0
        ? Math.round((workoutCompleted.length / workoutTotal) * 100)
        : 0,
    },
    meal: {
      scheduled: mealScheduled.length,
      completed: mealCompleted.length,
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
      targetCalories: Math.round(mTargetCalories),
      targetProtein: Math.round(mTargetProtein),
      avgTargetCalories: daysWithTargets > 0 ? Math.round(mTargetCalories / daysWithTargets) : 0,
      daysWithTargets,
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
    /** 운동 이벤트 제목 (예: "가슴 + 삼두") */
    workoutTitle?: string;
    /** 운동 예상 시간 (분) */
    workoutDuration?: number;
    /** 운동 예상 소모 칼로리 */
    workoutCalories?: number;
    /** 식단 총 칼로리 */
    mealCalories?: number;
    /** 식단 목표 칼로리 */
    mealTargetCalories?: number;
    /** 식단 총 단백질 */
    mealProtein?: number;
    /** 식단 총 탄수화물 */
    mealCarbs?: number;
    /** 식단 총 지방 */
    mealFat?: number;
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

    let workoutTitle: string | undefined;
    let workoutDuration: number | undefined;
    let workoutCalories: number | undefined;
    if (workoutEvent) {
      workoutTitle = workoutEvent.title;
      if (isWorkoutData(workoutEvent.data)) {
        // 실측 시간(elapsedSeconds) 우선, 없으면 예상 시간
        workoutDuration = workoutEvent.data.elapsedSeconds
          ? Math.round(workoutEvent.data.elapsedSeconds / 60)
          : (workoutEvent.data.estimatedDuration ?? undefined);
        workoutCalories = workoutEvent.data.estimatedCaloriesBurned ?? undefined;
      }
    }

    let mealCalories: number | undefined;
    let mealTargetCalories: number | undefined;
    let mealProtein: number | undefined;
    let mealCarbs: number | undefined;
    let mealFat: number | undefined;
    if (mealEvent && isMealData(mealEvent.data)) {
      const nutrients = calculateMealNutrients(mealEvent.data);
      if (nutrients.calories > 0) mealCalories = nutrients.calories;
      if (nutrients.protein > 0) mealProtein = nutrients.protein;
      if (nutrients.carbs > 0) mealCarbs = nutrients.carbs;
      if (nutrients.fat > 0) mealFat = nutrients.fat;
      if (mealEvent.data.targetCalories) mealTargetCalories = mealEvent.data.targetCalories;
    }

    dailyStats.push({
      date: dateStr,
      dayOfWeek: getDayOfWeek(currentDate),
      workout: workoutEvent?.status ?? null,
      meal: mealEvent?.status ?? null,
      workoutTitle,
      workoutDuration,
      workoutCalories,
      mealCalories,
      mealTargetCalories,
      mealProtein,
      mealCarbs,
      mealFat,
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
    // ── 운동 기록 ──
    /** 주간 운동 완료 수 */
    workoutCompleted: number;
    /** 주간 운동 전체 수 */
    workoutTotal: number;
    /** 주간 총 운동 시간 (분) */
    workoutDuration: number;
    /** 주간 총 볼륨 (kg) */
    workoutVolume: number;
    /** 주간 총 종목 수 */
    workoutExercises: number;
    /** 주간 총 세트 수 */
    workoutSets: number;
    // ── 식단 기록 ──
    /** 주간 식단 완료 수 */
    mealCompleted: number;
    /** 주간 식단 전체 수 */
    mealTotal: number;
    /** 주간 평균 칼로리 (완료일 기준) */
    avgCalories: number;
    /** 주간 평균 단백질 */
    avgProtein: number;
    /** 주간 평균 탄수화물 */
    avgCarbs: number;
    /** 주간 평균 지방 */
    avgFat: number;
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

    const weekWorkoutCompletedEvents = weekWorkouts.filter(
      (e) => e.status === 'completed',
    );
    const weekWorkoutCompleted = weekWorkoutCompletedEvents.length;
    const weekMealCompletedEvents = weekMeals.filter(
      (e) => e.status === 'completed',
    );
    const weekMealCompleted = weekMealCompletedEvents.length;

    // 주간 완료 운동 메트릭 합산
    let wkDuration = 0;
    let wkVolume = 0;
    let wkExercises = 0;
    let wkSets = 0;
    for (const event of weekWorkoutCompletedEvents) {
      if (isWorkoutData(event.data)) {
        const dMin = event.data.elapsedSeconds
          ? Math.round(event.data.elapsedSeconds / 60)
          : (event.data.estimatedDuration ?? 0);
        wkDuration += dMin;
        wkVolume += calculateWorkoutVolume(event.data);
        wkExercises += event.data.exercises.length;
        wkSets += event.data.exercises.reduce((s, ex) => s + ex.sets.length, 0);
      }
    }

    // 주간 완료 식단의 영양소 합산
    let wkCalories = 0;
    let wkProtein = 0;
    let wkCarbs = 0;
    let wkFat = 0;
    for (const event of weekMealCompletedEvents) {
      if (isMealData(event.data)) {
        const nutrients = calculateMealNutrients(event.data);
        wkCalories += nutrients.calories;
        wkProtein += nutrients.protein;
        wkCarbs += nutrients.carbs;
        wkFat += nutrients.fat;
      }
    }

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
      workoutCompleted: weekWorkoutCompleted,
      workoutTotal: weekWorkouts.length,
      workoutDuration: wkDuration,
      workoutVolume: wkVolume,
      workoutExercises: wkExercises,
      workoutSets: wkSets,
      mealCompleted: weekMealCompleted,
      mealTotal: weekMeals.length,
      avgCalories: weekMealCompleted > 0 ? Math.round(wkCalories / weekMealCompleted) : 0,
      avgProtein: weekMealCompleted > 0 ? Math.round(wkProtein / weekMealCompleted) : 0,
      avgCarbs: weekMealCompleted > 0 ? Math.round(wkCarbs / weekMealCompleted) : 0,
      avgFat: weekMealCompleted > 0 ? Math.round(wkFat / weekMealCompleted) : 0,
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

// ============================================================================
// Streak Computation
// ============================================================================

/**
 * 연속 운동 완료일 수 계산
 *
 * dailyStats를 날짜 역순으로 정렬 후 오늘부터 과거로 순회하며
 * completed가 연속인 일수를 세고, scheduled가 나오면 중단.
 */
export function computeWorkoutStreak(dailyStats: WeeklyStats['dailyStats']): number {
  const today = formatDate(new Date());
  const days = [...dailyStats].sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  for (const day of days) {
    if (day.date > today) continue;
    if (day.workout === 'completed') {
      streak++;
    } else if (day.workout === 'scheduled') {
      break;
    }
  }
  return streak;
}

// ============================================================================
// Balance Score (영양소 균형 점수)
// ============================================================================

export interface MacroValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * 실제 섭취량 vs 목표량의 균형 점수 (0-100)
 *
 * 각 매크로별 min(actual/target, target/actual) * 100으로 대칭 비율 계산 후 평균
 */
export function calculateBalanceScore(actual: MacroValues, target: MacroValues): number {
  const pairs = [
    { a: actual.calories, t: target.calories },
    { a: actual.protein, t: target.protein },
    { a: actual.carbs, t: target.carbs },
    { a: actual.fat, t: target.fat },
  ].filter((p) => p.t > 0);

  if (pairs.length === 0) return 0;

  const total = pairs.reduce((sum, { a, t }) => {
    const ratio = t > 0 ? a / t : 0;
    const adherence = Math.min(ratio, 1 / Math.max(ratio, 0.001)) * 100;
    return sum + Math.min(adherence, 100);
  }, 0);

  return Math.round(total / pairs.length);
}

export function getBalanceLabel(score: number): { text: string; colorClass: string } {
  if (score >= 90) return { text: '균형 잡힘', colorClass: 'text-primary' };
  if (score >= 70) return { text: '양호', colorClass: 'text-positive' };
  if (score >= 50) return { text: '개선 필요', colorClass: 'text-warning' };
  return { text: '주의', colorClass: 'text-destructive' };
}
