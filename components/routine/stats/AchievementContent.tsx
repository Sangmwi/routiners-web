'use client';

import { Suspense, useState, useCallback } from 'react';
import { BarbellIcon, ForkKnifeIcon, CalendarCheckIcon, FireIcon } from '@phosphor-icons/react';
import { PulseLoader } from '@/components/ui/PulseLoader';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import PeriodTabs, { type StatsPeriod } from './PeriodTabs';
import WeeklyProgressChart from './WeeklyProgressChart';
import MonthlyProgressChart from './MonthlyProgressChart';
import { useWeeklyStatsSuspense, useMonthlyStatsSuspense } from '@/hooks/routine';
import type { WeeklyStats, MonthlyStats } from '@/hooks/routine';
import { getWeekRange, getMonthRange, addDays, formatDate } from '@/lib/utils/dateHelpers';

/**
 * 달성 탭 콘텐츠
 *
 * - 완료일 배너
 * - 달성률 카드 2열 (운동/식단)
 * - 일별 현황 (주간) / 주차별 현황 (월간)
 */
export default function AchievementContent() {
  const [period, setPeriod] = useState<StatsPeriod>('weekly');
  const [weekBaseDate, setWeekBaseDate] = useState(() => new Date());
  const [monthYear, setMonthYear] = useState(() => ({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  }));

  const weekRange = getWeekRange(weekBaseDate);
  const monthRange = getMonthRange(monthYear.year, monthYear.month);
  const label = period === 'weekly' ? weekRange.weekLabel : monthRange.monthLabel;

  const today = new Date();
  const canGoNext = period === 'weekly'
    ? new Date(weekRange.endDate) < today
    : (monthYear.year < today.getFullYear() ||
       (monthYear.year === today.getFullYear() && monthYear.month < today.getMonth() + 1));

  const handlePrev = useCallback(() => {
    if (period === 'weekly') {
      setWeekBaseDate((prev) => addDays(prev, -7));
    } else {
      setMonthYear((prev) => {
        if (prev.month === 1) return { year: prev.year - 1, month: 12 };
        return { ...prev, month: prev.month - 1 };
      });
    }
  }, [period]);

  const handleNext = useCallback(() => {
    if (!canGoNext) return;
    if (period === 'weekly') {
      setWeekBaseDate((prev) => addDays(prev, 7));
    } else {
      setMonthYear((prev) => {
        if (prev.month === 12) return { year: prev.year + 1, month: 1 };
        return { ...prev, month: prev.month + 1 };
      });
    }
  }, [period, canGoNext]);

  return (
    <div>
      <PeriodTabs
        period={period}
        onPeriodChange={setPeriod}
        label={label}
        onPrev={handlePrev}
        onNext={handleNext}
        canGoNext={canGoNext}
      />

      <div className="mt-6">
        <QueryErrorBoundary>
          <Suspense fallback={<PulseLoader />}>
            {period === 'weekly' ? (
              <WeeklyAchievement dateStr={formatDate(weekBaseDate)} />
            ) : (
              <MonthlyAchievement year={monthYear.year} month={monthYear.month} />
            )}
          </Suspense>
        </QueryErrorBoundary>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Weekly Achievement
// ---------------------------------------------------------------------------

function WeeklyAchievement({ dateStr }: { dateStr: string }) {
  const stats = useWeeklyStatsSuspense(dateStr);

  // 이전 주 데이터 (비교용)
  const prevDateStr = formatDate(addDays(new Date(dateStr), -7));
  const prevStats = useWeeklyStatsSuspense(prevDateStr);

  if (!stats || (stats.workout.scheduled === 0 && stats.meal.scheduled === 0)) {
    return (
      <p className="text-muted-foreground text-center py-8">
        예정된 루틴이 없어요.
      </p>
    );
  }

  const comparison = prevStats ? {
    workoutDiff: stats.workout.completionRate - prevStats.workout.completionRate,
    mealDiff: stats.meal.completionRate - prevStats.meal.completionRate,
    label: '지난주',
  } : undefined;

  // Streak: 연속 운동 완료일 (이전 주 + 이번 주 합산, 최대 14일 윈도우)
  const streak = computeWorkoutStreak(
    prevStats ? [...prevStats.dailyStats, ...stats.dailyStats] : stats.dailyStats,
  );

  return (
    <div className="space-y-10">
      {streak >= 2 && <StreakBanner count={streak} />}
      <AchievementCards stats={stats} totalLabel="7일" comparison={comparison} />
      <WeeklyProgressChart stats={stats} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Monthly Achievement
// ---------------------------------------------------------------------------

function MonthlyAchievement({ year, month }: { year: number; month: number }) {
  const stats = useMonthlyStatsSuspense(year, month);

  // 이전 월 데이터 (비교용)
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevStats = useMonthlyStatsSuspense(prevYear, prevMonth);

  if (!stats || (stats.workout.scheduled === 0 && stats.meal.scheduled === 0)) {
    return (
      <p className="text-muted-foreground text-center py-8">
        예정된 루틴이 없어요.
      </p>
    );
  }

  const comparison = prevStats ? {
    workoutDiff: stats.workout.completionRate - prevStats.workout.completionRate,
    mealDiff: stats.meal.completionRate - prevStats.meal.completionRate,
    label: '지난달',
  } : undefined;

  return (
    <div className="space-y-10">
      <AchievementCards stats={stats} totalLabel={`${stats.totalDays}일`} comparison={comparison} />
      <MonthlyProgressChart stats={stats} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Achievement Cards (shared between weekly/monthly)
// ---------------------------------------------------------------------------

interface ComparisonData {
  workoutDiff: number;
  mealDiff: number;
  label: string;
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
  const workoutTotal = workout.completed + workout.scheduled + workout.skipped;
  const mealTotal = meal.completed + meal.scheduled + meal.skipped;

  return (
    <div className="space-y-6">
      {/* 완료일 배너 */}
      {stats.completedDays > 0 && (
        <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-4 py-3">
          <CalendarCheckIcon size={20} weight="fill" className="text-primary" />
          <span className="text-sm font-medium text-foreground">
            {totalLabel} 중 <span className="text-primary">{stats.completedDays}일</span> 완료
          </span>
        </div>
      )}

      {/* 달성률 카드 2열 */}
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
          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px] text-muted-foreground">
              {workoutTotal > 0 ? `${workout.completed}/${workoutTotal}일 완료` : '예정 없음'}
            </p>
            {comparison && comparison.workoutDiff !== 0 && (
              <ComparisonBadge diff={comparison.workoutDiff} label={comparison.label} />
            )}
          </div>
        </div>

        {/* 식단 */}
        <div className="bg-muted/20 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <ForkKnifeIcon size={16} weight="fill" className="text-primary/70" />
            <span className="text-xs font-medium text-muted-foreground">식단</span>
          </div>
          <p className="text-2xl font-bold text-foreground mb-2">
            {meal.completionRate}%
          </p>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/50 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, meal.completionRate))}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px] text-muted-foreground">
              {mealTotal > 0 ? `${meal.completed}/${mealTotal}일 완료` : '예정 없음'}
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

function ComparisonBadge({ diff, label }: { diff: number; label: string }) {
  const isPositive = diff > 0;
  return (
    <span className={`text-[10px] font-medium ${isPositive ? 'text-emerald-500' : 'text-red-400'}`}>
      {isPositive ? '▲' : '▼'}{Math.abs(diff)}% vs {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Streak
// ---------------------------------------------------------------------------

/**
 * 오늘(또는 가장 최근 과거일)부터 역순으로 연속 운동 완료일 계산
 * - 운동 완료 → streak++
 * - 운동 예정/건너뜀 → break
 * - 운동 없는 날 → skip (휴식일은 streak을 끊지 않음)
 */
function computeWorkoutStreak(
  dailyStats: WeeklyStats['dailyStats'],
): number {
  const today = formatDate(new Date());
  const days = [...dailyStats].sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  for (const day of days) {
    if (day.date > today) continue;
    if (day.workout === 'completed') {
      streak++;
    } else if (day.workout === 'scheduled' || day.workout === 'skipped') {
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
