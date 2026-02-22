'use client';

import { Suspense, useState } from 'react';
import {
  BarbellIcon,
  CalendarCheckIcon,
  FireIcon,
  ForkKnifeIcon,
} from '@phosphor-icons/react';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import DateJumpSheet from '@/components/ui/DateJumpSheet';
import { PulseLoader } from '@/components/ui/PulseLoader';
import {
  useMonthlyStatsSuspense,
  useStatsPeriodNavigator,
  useWeeklyStatsSuspense,
} from '@/hooks/routine';
import type { MonthlyStats, WeeklyStats } from '@/hooks/routine';
import { addDays, formatDate, parseDate } from '@/lib/utils/dateHelpers';
import PeriodTabs from './PeriodTabs';
import WeeklyProgressChart from './WeeklyProgressChart';

interface ComparisonData {
  workoutDiff: number;
  mealDiff: number;
  label: string;
}

export default function AchievementContent() {
  const {
    period,
    setPeriod,
    setWeekBaseDate,
    monthYear,
    setMonthYear,
    label,
    yearLabel,
    canGoNext,
    handlePrev,
    handleNext,
    weekDateStr,
  } = useStatsPeriodNavigator('weekly');
  const [isDateJumpOpen, setIsDateJumpOpen] = useState(false);
  const [dateJumpSession, setDateJumpSession] = useState(0);

  const today = new Date();
  const todayStr = formatDate(today);
  const startYear = today.getFullYear() - 5;
  const minDate = `${startYear}-01-01`;

  return (
    <div>
      <PeriodTabs
        period={period}
        onPeriodChange={setPeriod}
        label={label}
        yearLabel={yearLabel}
        onPrev={handlePrev}
        onNext={handleNext}
        canGoNext={canGoNext}
        onDateLabelClick={() => {
          setDateJumpSession((prev) => prev + 1);
          setIsDateJumpOpen(true);
        }}
        dateLabelAriaLabel={period === 'weekly' ? '주간 날짜 선택' : '월간 날짜 선택'}
      />

      <div className="mt-6">
        <QueryErrorBoundary>
          <Suspense fallback={<PulseLoader />}>
            {period === 'weekly' ? (
              <WeeklyAchievement dateStr={weekDateStr} />
            ) : (
              <MonthlyAchievement year={monthYear.year} month={monthYear.month} />
            )}
          </Suspense>
        </QueryErrorBoundary>
      </div>

      {period === 'weekly' ? (
        <DateJumpSheet
          key={`achievement-date-${dateJumpSession}`}
          mode="date"
          isOpen={isDateJumpOpen}
          onClose={() => setIsDateJumpOpen(false)}
          title="주간 날짜 선택"
          value={weekDateStr}
          minDate={minDate}
          maxDate={todayStr}
          onConfirm={({ date }) => {
            setWeekBaseDate(parseDate(date));
          }}
        />
      ) : (
        <DateJumpSheet
          key={`achievement-month-${dateJumpSession}`}
          mode="yearMonth"
          isOpen={isDateJumpOpen}
          onClose={() => setIsDateJumpOpen(false)}
          title="월간 날짜 선택"
          year={String(monthYear.year)}
          month={String(monthYear.month).padStart(2, '0')}
          yearRange={{ start: startYear, end: today.getFullYear() }}
          onConfirm={({ year, month }) => {
            setMonthYear({
              year: parseInt(year, 10),
              month: parseInt(month, 10),
            });
          }}
        />
      )}
    </div>
  );
}

function WeeklyAchievement({ dateStr }: { dateStr: string }) {
  const stats = useWeeklyStatsSuspense(dateStr);
  const prevDateStr = formatDate(addDays(new Date(dateStr), -7));
  const prevStats = useWeeklyStatsSuspense(prevDateStr);

  if (!stats || (stats.workout.scheduled + stats.workout.completed === 0 && stats.meal.scheduled + stats.meal.completed === 0)) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <CalendarCheckIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">루틴 기록이 없습니다.</p>
      </div>
    );
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
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <CalendarCheckIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">루틴 기록이 없습니다.</p>
      </div>
    );
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
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, workout.completionRate))}%` }}
            />
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-[11px] text-muted-foreground">
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
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, meal.completionRate))}%` }}
            />
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-[11px] text-muted-foreground">
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

function ComparisonBadge({ diff, label }: { diff: number; label: string }) {
  const isPositive = diff > 0;
  return (
    <span className="text-[10px] font-medium">
      <span className={isPositive ? 'text-positive' : 'text-negative'}>
        {isPositive ? '▲' : '▼'}
        {Math.abs(diff)}%
      </span>
      <span className="text-muted-foreground"> {label} 대비</span>
    </span>
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
