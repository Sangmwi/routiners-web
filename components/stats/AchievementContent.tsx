'use client';

import {
  BarbellIcon,
  CalendarCheckIcon,
  FireIcon,
  ForkKnifeIcon,
} from '@phosphor-icons/react';
import EmptyState from '@/components/common/EmptyState';
import ComparisonBadge from '@/components/ui/ComparisonBadge';
import {
  useMonthlyStatsSuspense,
  useWeeklyStatsSuspense,
} from '@/hooks/routine';
import type { MonthlyStats, WeeklyStats } from '@/hooks/routine';
import { addDays, formatDate } from '@/lib/utils/dateHelpers';
import StatsTabShell from './StatsTabShell';
import WeeklyProgressChart from './WeeklyProgressChart';

interface ComparisonData {
  workoutDiff: number;
  mealDiff: number;
  label: string;
}

export default function AchievementContent() {
  return (
    <StatsTabShell
      weeklyContent={(dateStr) => <WeeklyAchievement dateStr={dateStr} />}
      monthlyContent={(year, month) => <MonthlyAchievement year={year} month={month} />}
    />
  );
}

function WeeklyAchievement({ dateStr }: { dateStr: string }) {
  const stats = useWeeklyStatsSuspense(dateStr);
  const prevDateStr = formatDate(addDays(new Date(dateStr), -7));
  const prevStats = useWeeklyStatsSuspense(prevDateStr);

  if (!stats || (stats.workout.scheduled + stats.workout.completed === 0 && stats.meal.scheduled + stats.meal.completed === 0)) {
    return <EmptyState icon={CalendarCheckIcon} message="루틴 기록이 없습니다." className="rounded-2xl bg-muted/20" />;
  }

  const comparison = prevStats
    ? {
        workoutDiff: stats.workout.completionRate - prevStats.workout.completionRate,
        mealDiff: stats.meal.completionRate - prevStats.meal.completionRate,
        label: '지난주',
      }
    : undefined;

  const streak = computeWorkoutStreak(
    prevStats ? [...prevStats.dailyStats, ...stats.dailyStats] : stats.dailyStats,
  );

  return (
    <div>
      <div className="space-y-2">
        {streak >= 2 && <StreakBanner count={streak} />}
        <AchievementCards stats={stats} totalLabel="7일" comparison={comparison} />
      </div>
      <div className="mt-10">
        <WeeklyProgressChart stats={stats} />
      </div>
    </div>
  );
}

function MonthlyAchievement({ year, month }: { year: number; month: number }) {
  const stats = useMonthlyStatsSuspense(year, month);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevStats = useMonthlyStatsSuspense(prevYear, prevMonth);

  if (!stats || (stats.workout.scheduled + stats.workout.completed === 0 && stats.meal.scheduled + stats.meal.completed === 0)) {
    return <EmptyState icon={CalendarCheckIcon} message="루틴 기록이 없습니다." className="rounded-2xl bg-muted/20" />;
  }

  const comparison = prevStats
    ? {
        workoutDiff: stats.workout.completionRate - prevStats.workout.completionRate,
        mealDiff: stats.meal.completionRate - prevStats.meal.completionRate,
        label: '지난달',
      }
    : undefined;

  return (
    <div className="space-y-10">
      <AchievementCards stats={stats} totalLabel={`${stats.totalDays}일`} comparison={comparison} />
    </div>
  );
}

function AchievementCards({
  stats,
  totalLabel,
  comparison,
}: {
  stats: WeeklyStats | MonthlyStats;
  totalLabel: string;
  comparison?: ComparisonData;
}) {
  const { workout, meal } = stats;
  const workoutTotal = workout.completed + workout.scheduled;
  const mealTotal = meal.completed + meal.scheduled;

  return (
    <div className="space-y-6">
      {stats.completedDays > 0 && (
        <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-4 py-3">
          <CalendarCheckIcon size={20} weight="fill" className="text-primary" />
          <span className="text-sm font-medium text-foreground">
            {totalLabel} 중 <span className="text-primary">{stats.completedDays}일</span> 완료
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/20 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <BarbellIcon size={16} weight="fill" className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground">운동</span>
          </div>
          <p className="text-2xl font-bold text-foreground mb-2">{workout.completionRate}%</p>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, workout.completionRate))}%` }}
            />
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              {workoutTotal > 0 ? `${workout.completed}/${workoutTotal}개 완료` : '일정 없음'}
            </p>
            {comparison && comparison.workoutDiff !== 0 && (
              <ComparisonBadge diff={comparison.workoutDiff} label={comparison.label} />
            )}
          </div>
        </div>

        <div className="bg-muted/20 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <ForkKnifeIcon size={16} weight="fill" className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground">식단</span>
          </div>
          <p className="text-2xl font-bold text-foreground mb-2">{meal.completionRate}%</p>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, meal.completionRate))}%` }}
            />
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              {mealTotal > 0 ? `${meal.completed}/${mealTotal}개 완료` : '일정 없음'}
            </p>
            {comparison && comparison.mealDiff !== 0 && (
              <ComparisonBadge diff={comparison.mealDiff} label={comparison.label} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function computeWorkoutStreak(dailyStats: WeeklyStats['dailyStats']): number {
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

function StreakBanner({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 bg-amber-500/10 rounded-xl px-4 py-3">
      <FireIcon size={20} weight="fill" className="text-amber-500" />
      <span className="text-sm font-medium text-foreground">
        <span className="text-amber-500">{count}일</span> 연속 운동 완료!
      </span>
    </div>
  );
}
