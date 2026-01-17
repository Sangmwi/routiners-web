'use client';

import { LightningIcon, ForkKnifeIcon } from '@phosphor-icons/react';
import ProgressBar from './ProgressBar';
import type { WeeklyStats } from '@/hooks/routine';

interface WeeklyStatsSummaryProps {
  stats: WeeklyStats;
}

/**
 * 주간 통계 요약 (상세 페이지용)
 *
 * 운동/식단 달성률 + 추가 정보 표시
 */
export default function WeeklyStatsSummary({ stats }: WeeklyStatsSummaryProps) {
  const { workout, meal } = stats;

  // 운동 완료 일수
  const workoutTotal = workout.completed + workout.scheduled + workout.skipped;
  const workoutText = workoutTotal > 0
    ? `${workout.completed}/${workoutTotal}일 (${workout.completionRate}%)`
    : '예정된 운동 없음';

  // 식단 완료 일수
  const mealTotal = meal.completed + meal.scheduled + meal.skipped;
  const mealText = mealTotal > 0
    ? `${meal.completed}/${mealTotal}일 (${meal.completionRate}%)`
    : '예정된 식단 없음';

  // 볼륨 포맷
  const volumeText = workout.totalVolume > 0
    ? `총 볼륨: ${workout.totalVolume.toLocaleString()}kg`
    : null;

  // 식단 영양소 포맷
  const nutritionText =
    meal.avgCalories > 0 || meal.avgProtein > 0
      ? `평균: ${meal.avgCalories.toLocaleString()}kcal • 단백질 ${meal.avgProtein}g`
      : null;

  return (
    <div className="space-y-4">
      {/* 운동 섹션 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <LightningIcon size={18} weight="fill" className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">운동</span>
              <span className="text-sm text-muted-foreground">{workoutText}</span>
            </div>
          </div>
        </div>
        <ProgressBar value={workout.completionRate} size="md" />
        {volumeText && (
          <p className="text-sm text-muted-foreground mt-2">{volumeText}</p>
        )}
      </div>

      {/* 식단 섹션 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ForkKnifeIcon size={18} weight="fill" className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">식단</span>
              <span className="text-sm text-muted-foreground">{mealText}</span>
            </div>
          </div>
        </div>
        <ProgressBar value={meal.completionRate} size="md" />
        {nutritionText && (
          <p className="text-sm text-muted-foreground mt-2">{nutritionText}</p>
        )}
      </div>
    </div>
  );
}
