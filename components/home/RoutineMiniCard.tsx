'use client';

import { BarbellIcon, ForkKnifeIcon } from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import type { WeeklyStats } from '@/hooks/routine';

interface RoutineMiniCardProps {
  stats: WeeklyStats;
}

export default function RoutineMiniCard({ stats }: RoutineMiniCardProps) {
  const totalEvents =
    stats.workout.scheduled + stats.workout.completed + stats.workout.skipped +
    stats.meal.scheduled + stats.meal.completed + stats.meal.skipped;

  const workoutTotal = stats.workout.completed + stats.workout.scheduled + stats.workout.skipped;
  const mealTotal = stats.meal.completed + stats.meal.scheduled + stats.meal.skipped;

  // 운동 서브 정보
  const workoutSubs: string[] = [];
  if (workoutTotal > 0) {
    workoutSubs.push(`${stats.workout.completed}/${workoutTotal}회 완료`);
  }
  if (stats.workout.totalDuration > 0) {
    workoutSubs.push(`총 ${stats.workout.totalDuration}분`);
  }
  if (stats.workout.totalCaloriesBurned > 0) {
    workoutSubs.push(`${stats.workout.totalCaloriesBurned.toLocaleString()}kcal`);
  }

  // 식단 서브 정보
  const mealSubs: string[] = [];
  if (mealTotal > 0) {
    mealSubs.push(`${stats.meal.completed}/${mealTotal}회 완료`);
  }
  if (stats.meal.avgCalories > 0) {
    mealSubs.push(`평균 ${stats.meal.avgCalories.toLocaleString()}kcal`);
  }
  if (stats.meal.avgProtein > 0) {
    mealSubs.push(`단백질 ${stats.meal.avgProtein}g`);
  }

  return (
    <section>
      <SectionHeader
        title="이번 주 루틴"
        action={totalEvents === 0
          ? { label: '루틴 생성', href: '/routine/counselor' }
          : { label: '통계', href: '/routine/stats' }
        }
      />

      <div className="grid grid-cols-2 gap-3 mt-3">
        {/* 운동 카드 */}
        <div className="bg-muted/20 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <BarbellIcon size={16} weight="fill" className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground">운동</span>
          </div>

          <p className="text-2xl font-bold text-foreground mb-2">
            {stats.workout.completionRate}%
          </p>

          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, stats.workout.completionRate))}%` }}
            />
          </div>

          {workoutSubs.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              {workoutSubs.join(' · ')}
            </p>
          )}
          {workoutTotal === 0 && (
            <p className="text-xs text-muted-foreground/60 mt-3">예정 없음</p>
          )}
        </div>

        {/* 식단 카드 */}
        <div className="bg-muted/20 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <ForkKnifeIcon size={16} weight="fill" className="text-primary/70" />
            <span className="text-xs font-medium text-muted-foreground">식단</span>
          </div>

          <p className="text-2xl font-bold text-foreground mb-2">
            {stats.meal.completionRate}%
          </p>

          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, stats.meal.completionRate))}%` }}
            />
          </div>

          {mealSubs.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              {mealSubs.join(' · ')}
            </p>
          )}
          {mealTotal === 0 && (
            <p className="text-xs text-muted-foreground/60 mt-3">예정 없음</p>
          )}
        </div>
      </div>
    </section>
  );
}
