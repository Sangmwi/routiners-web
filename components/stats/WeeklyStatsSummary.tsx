'use client';

import { BarbellIcon, ForkKnifeIcon, CalendarCheckIcon } from '@phosphor-icons/react';
import type { WeeklyStats } from '@/hooks/routine';

interface WeeklyStatsSummaryProps {
  stats: WeeklyStats;
}

/**
 * 주간 통계 요약
 *
 * - 완료일 배너 / 예정 배너
 * - 달성률 카드 2장
 * - 운동 요약 (실제 or 예정)
 * - 영양 섭취 (실제 or 예정)
 */
export default function WeeklyStatsSummary({ stats }: WeeklyStatsSummaryProps) {
  const { workout, meal } = stats;

  const workoutTotal = workout.completed + workout.scheduled;
  const mealTotal = meal.completed + meal.scheduled;
  const hasCompleted = workout.completed > 0 || meal.completed > 0;

  // 운동 메트릭: 완료 실적 → 예정 메트릭 fallback
  const workoutMetrics: { label: string; value: string }[] = [];
  if (workout.totalDuration > 0) {
    workoutMetrics.push({ label: '운동 시간', value: `${workout.totalDuration}분` });
  } else if (workout.plannedDuration > 0) {
    workoutMetrics.push({ label: '예상 시간', value: `${workout.plannedDuration}분` });
  }
  if (workout.totalCaloriesBurned > 0) {
    workoutMetrics.push({ label: '소모 칼로리', value: `${workout.totalCaloriesBurned.toLocaleString()}kcal` });
  } else if (workout.plannedCaloriesBurned > 0) {
    workoutMetrics.push({ label: '예상 소모', value: `${workout.plannedCaloriesBurned.toLocaleString()}kcal` });
  }
  if (workout.totalVolume > 0) {
    workoutMetrics.push({ label: '총 볼륨', value: `${workout.totalVolume.toLocaleString()}kg` });
  } else if (workout.plannedVolume > 0) {
    workoutMetrics.push({ label: '예상 볼륨', value: `${workout.plannedVolume.toLocaleString()}kg` });
  }
  if (workout.totalDistance > 0) {
    workoutMetrics.push({ label: '런닝 거리', value: `${workout.totalDistance.toFixed(1)}km` });
  } else if (workout.plannedDistance > 0) {
    workoutMetrics.push({ label: '예상 거리', value: `${workout.plannedDistance.toFixed(1)}km` });
  }

  // 영양 메트릭: 완료 실적 → 예정 메트릭 fallback
  const nutritionMetrics: { label: string; value: string }[] = [];
  if (meal.totalCalories > 0) {
    nutritionMetrics.push({ label: '총 섭취', value: `${meal.totalCalories.toLocaleString()}kcal` });
  } else if (meal.plannedCalories > 0) {
    nutritionMetrics.push({ label: '예상 섭취', value: `${meal.plannedCalories.toLocaleString()}kcal` });
  }
  if (meal.totalProtein > 0) {
    nutritionMetrics.push({ label: '총 단백질', value: `${meal.totalProtein}g` });
  } else if (meal.plannedProtein > 0) {
    nutritionMetrics.push({ label: '예상 단백질', value: `${meal.plannedProtein}g` });
  }
  if (meal.avgCalories > 0) {
    nutritionMetrics.push({ label: '일평균', value: `${meal.avgCalories.toLocaleString()}kcal` });
  }

  // 매크로 (완료 데이터만)
  const macroMetrics: { label: string; value: string }[] = [];
  if (meal.totalCarbs > 0) {
    macroMetrics.push({ label: '탄수화물', value: `${meal.totalCarbs}g` });
  }
  if (meal.totalProtein > 0) {
    macroMetrics.push({ label: '단백질', value: `${meal.totalProtein}g` });
  }
  if (meal.totalFat > 0) {
    macroMetrics.push({ label: '지방', value: `${meal.totalFat}g` });
  }

  const hasNutrition = nutritionMetrics.length > 0;
  const hasMacros = macroMetrics.length >= 2;
  const isPlannedOnly = !hasCompleted && workoutMetrics.length > 0;

  const gridCols = (n: number) =>
    n <= 1 ? 'grid-cols-1' : n === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="space-y-6">
      {/* 완료일 배너 */}
      {stats.completedDays > 0 && (
        <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-4 py-3">
          <CalendarCheckIcon size={20} weight="fill" className="text-primary" />
          <span className="text-sm font-medium text-foreground">
            7일 중 <span className="text-primary">{stats.completedDays}일</span> 완료
          </span>
        </div>
      )}

      {/* 달성률 카드 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 운동 */}
        <div className="bg-muted/20 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <BarbellIcon size={16} weight="fill" className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground">운동</span>
          </div>
          <p className="text-2xl font-bold text-foreground mb-2">
            {workout.completionRate}%
          </p>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, workout.completionRate))}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            {workoutTotal > 0 ? `${workout.completed}/${workoutTotal}일 완료` : '예정 없음'}
          </p>
        </div>

        {/* 식단 */}
        <div className="bg-muted/20 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <ForkKnifeIcon size={16} weight="fill" className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground">식단</span>
          </div>
          <p className="text-2xl font-bold text-foreground mb-2">
            {meal.completionRate}%
          </p>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, meal.completionRate))}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            {mealTotal > 0 ? `${meal.completed}/${mealTotal}일 완료` : '예정 없음'}
          </p>
        </div>
      </div>

      {/* 운동 요약 */}
      {workoutMetrics.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <h3 className="text-sm font-medium text-foreground">운동 요약</h3>
            {isPlannedOnly && (
              <span className="text-[10px] text-scheduled bg-scheduled/10 px-1.5 py-0.5 rounded-md">예정</span>
            )}
          </div>
          <div className="bg-muted/20 rounded-2xl p-4">
            <div className={`grid ${gridCols(workoutMetrics.length)} gap-3`}>
              {workoutMetrics.map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                  <p className="text-base font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 영양 섭취 */}
      {hasNutrition && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <h3 className="text-sm font-medium text-foreground">영양 섭취</h3>
            {meal.completed === 0 && meal.plannedCalories > 0 && (
              <span className="text-[10px] text-scheduled bg-scheduled/10 px-1.5 py-0.5 rounded-md">예정</span>
            )}
          </div>
          <div className="bg-muted/20 rounded-2xl p-4 space-y-4">
            <div className={`grid ${gridCols(nutritionMetrics.length)} gap-3`}>
              {nutritionMetrics.map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                  <p className="text-base font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            {/* 매크로 비율 */}
            {hasMacros && (
              <div className="border-t border-border/20 pt-3">
                <p className="text-[11px] text-muted-foreground mb-2 text-center">매크로 비율</p>
                <div className={`grid ${gridCols(macroMetrics.length)} gap-3`}>
                  {macroMetrics.map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-sm font-bold text-foreground">{value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
