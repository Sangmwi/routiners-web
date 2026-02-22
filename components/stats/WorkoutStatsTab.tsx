'use client';

import { Suspense, useState, type ReactNode } from 'react';
import {
  BarbellIcon,
  ChartLineUpIcon,
  CheckCircleIcon as CheckIcon,
  ClockIcon,
  FireIcon,
  PersonSimpleRunIcon,
  TimerIcon,
  TrophyIcon,
  XCircleIcon as XIcon,
} from '@phosphor-icons/react';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { Big3SummaryCard } from '@/components/progress/Big3SummaryCard';
import DateJumpSheet from '@/components/ui/DateJumpSheet';
import { PulseLoader } from '@/components/ui/PulseLoader';
import { useProgressSummarySuspense } from '@/hooks/progress';
import {
  useMonthlyStatsSuspense,
  useStatsPeriodNavigator,
  useWeeklyStatsSuspense,
} from '@/hooks/routine';
import { BIG3_LIFT_CONFIG } from '@/lib/constants/big3';
import type { MonthlyStats, WeeklyStats } from '@/hooks/routine';
import { addDays, formatDate, parseDate } from '@/lib/utils/dateHelpers';
import { getDisplayStatus } from '@/lib/config/theme';
import type { EventStatus } from '@/lib/types/routine';
import PeriodTabs from './PeriodTabs';

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

interface WorkoutMetricItem {
  icon: ReactNode;
  label: string;
  value: string;
  isPlanned?: boolean;
}

function buildWorkoutMetrics(workout: WeeklyStats['workout'] | MonthlyStats['workout']) {
  const metrics: WorkoutMetricItem[] = [];

  if (workout.totalDuration > 0) {
    metrics.push({
      icon: <TimerIcon size={18} weight="fill" className="text-primary" />,
      label: '운동 시간',
      value: `${workout.totalDuration}분`,
    });
  } else if (workout.plannedDuration > 0) {
    metrics.push({
      icon: <TimerIcon size={18} weight="duotone" className="text-muted-foreground" />,
      label: '예상 시간',
      value: `${workout.plannedDuration}분`,
      isPlanned: true,
    });
  }

  if (workout.totalCaloriesBurned > 0) {
    metrics.push({
      icon: <FireIcon size={18} weight="fill" className="text-primary" />,
      label: '소모 칼로리',
      value: `${workout.totalCaloriesBurned.toLocaleString()}kcal`,
    });
  } else if (workout.plannedCaloriesBurned > 0) {
    metrics.push({
      icon: <FireIcon size={18} weight="duotone" className="text-muted-foreground" />,
      label: '예상 소모',
      value: `${workout.plannedCaloriesBurned.toLocaleString()}kcal`,
      isPlanned: true,
    });
  }

  if (workout.totalVolume > 0) {
    metrics.push({
      icon: <ChartLineUpIcon size={18} weight="fill" className="text-primary" />,
      label: '총 볼륨',
      value: `${workout.totalVolume.toLocaleString()}kg`,
    });
  } else if (workout.plannedVolume > 0) {
    metrics.push({
      icon: <ChartLineUpIcon size={18} weight="duotone" className="text-muted-foreground" />,
      label: '예상 볼륨',
      value: `${workout.plannedVolume.toLocaleString()}kg`,
      isPlanned: true,
    });
  }

  if (workout.totalDistance > 0) {
    metrics.push({
      icon: <PersonSimpleRunIcon size={18} weight="fill" className="text-primary" />,
      label: '유산소 거리',
      value: `${workout.totalDistance.toFixed(1)}km`,
    });
  } else if (workout.plannedDistance > 0) {
    metrics.push({
      icon: <PersonSimpleRunIcon size={18} weight="duotone" className="text-muted-foreground" />,
      label: '예상 거리',
      value: `${workout.plannedDistance.toFixed(1)}km`,
      isPlanned: true,
    });
  }

  return metrics;
}

function WorkoutMetricsGrid({ metrics }: { metrics: WorkoutMetricItem[] }) {
  if (metrics.length === 0) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <BarbellIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">운동 데이터가 없습니다.</p>
      </div>
    );
  }

  const allPlanned = metrics.every((metric) => metric.isPlanned);
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <h3 className="text-sm font-medium text-foreground">운동 요약</h3>
        {allPlanned && (
          <span className="text-[10px] text-scheduled bg-scheduled/10 px-1.5 py-0.5 rounded-md">
            예정
          </span>
        )}
      </div>

      <div className="bg-muted/20 rounded-2xl p-4">
        <div className="grid grid-cols-2 gap-4">
          {metrics.map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="shrink-0">{icon}</div>
              <div>
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-base font-bold text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WorkoutStatsTab() {
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
              <WeeklyWorkoutMetrics dateStr={weekDateStr} />
            ) : (
              <MonthlyWorkoutMetrics year={monthYear.year} month={monthYear.month} />
            )}
          </Suspense>
        </QueryErrorBoundary>
      </div>

      <div className="mt-8">
        <QueryErrorBoundary>
          <Suspense fallback={<PulseLoader />}>
            <Big3Section />
          </Suspense>
        </QueryErrorBoundary>
      </div>

      {period === 'weekly' ? (
        <DateJumpSheet
          key={`workout-date-${dateJumpSession}`}
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
          key={`workout-month-${dateJumpSession}`}
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

function WorkoutCompletionCard({
  workout,
  comparison,
}: {
  workout: WeeklyStats['workout'] | MonthlyStats['workout'];
  comparison?: { diff: number; label: string };
}) {
  const total = workout.completed + workout.scheduled;
  return (
    <div className="bg-muted/20 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <BarbellIcon size={16} weight="fill" className="text-primary" />
        <span className="text-xs font-medium text-muted-foreground">달성률</span>
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
          {total > 0 ? `${workout.completed}/${total}개 완료` : '일정 없음'}
        </p>
        {comparison && comparison.diff !== 0 && (
          <ComparisonBadge diff={comparison.diff} label={comparison.label} />
        )}
      </div>
    </div>
  );
}

function DailyWorkoutLog({ dailyStats }: { dailyStats: WeeklyStats['dailyStats'] }) {
  const today = formatDate(new Date());

  return (
    <div>
      <h3 className="text-sm font-medium text-foreground mb-3">일별 기록</h3>
      <div className="bg-muted/20 rounded-2xl divide-y divide-border/20 overflow-hidden">
        {dailyStats.map((day) => {
          const isToday = day.date === today;
          const hasWorkout = day.workout !== null;

          const meta: string[] = [];
          if (day.workoutDuration) meta.push(`${day.workoutDuration}분`);
          if (day.workoutCalories) meta.push(`${day.workoutCalories}kcal`);

          return (
            <div key={day.date} className={`px-4 py-3 ${isToday ? 'bg-primary/5' : ''}`}>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold w-5 shrink-0 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {day.dayOfWeek}
                </span>
                {hasWorkout ? (
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <BarbellIcon size={13} weight="fill" className="text-primary shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">
                      {day.workoutTitle || '운동'}
                    </span>
                    {meta.length > 0 && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {meta.join(' · ')}
                      </span>
                    )}
                    <span className="ml-auto shrink-0">
                      <WorkoutStatusPill status={day.workout!} date={day.date} />
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground/50">활동 없음</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkoutStatusPill({ status, date }: { status: EventStatus; date: string }) {
  const displayStatus = getDisplayStatus(status, date);
  if (displayStatus === 'completed') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary">
        <CheckIcon size={12} weight="fill" />
        완료
      </span>
    );
  }
  if (displayStatus === 'incomplete') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground/40">
        <XIcon size={12} weight="fill" />
        미완료
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-scheduled">
      <ClockIcon size={12} weight="duotone" />
      예정
    </span>
  );
}

function WeeklyWorkoutMetrics({ dateStr }: { dateStr: string }) {
  const stats = useWeeklyStatsSuspense(dateStr);
  const prevDateStr = formatDate(addDays(new Date(dateStr), -7));
  const prevStats = useWeeklyStatsSuspense(prevDateStr);

  const workoutTotal = stats.workout.completed + stats.workout.scheduled;

  if (!stats || workoutTotal === 0) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <BarbellIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">운동 기록이 없습니다.</p>
      </div>
    );
  }

  const metrics = buildWorkoutMetrics(stats.workout);
  const comparison = prevStats
    ? { diff: stats.workout.completionRate - prevStats.workout.completionRate, label: '지난주' }
    : undefined;

  return (
    <div className="space-y-6">
      <WorkoutCompletionCard workout={stats.workout} comparison={comparison} />
      <WorkoutMetricsGrid metrics={metrics} />
      <DailyWorkoutLog dailyStats={stats.dailyStats} />
    </div>
  );
}

function MonthlyWorkoutMetrics({ year, month }: { year: number; month: number }) {
  const stats = useMonthlyStatsSuspense(year, month);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevStats = useMonthlyStatsSuspense(prevYear, prevMonth);

  const workoutTotal = stats.workout.completed + stats.workout.scheduled;

  if (!stats || workoutTotal === 0) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <BarbellIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">운동 기록이 없습니다.</p>
      </div>
    );
  }

  const metrics = buildWorkoutMetrics(stats.workout);
  const comparison = prevStats
    ? { diff: stats.workout.completionRate - prevStats.workout.completionRate, label: '지난달' }
    : undefined;

  return (
    <div className="space-y-6">
      <WorkoutCompletionCard workout={stats.workout} comparison={comparison} />
      <WorkoutMetricsGrid metrics={metrics} />
    </div>
  );
}

function Big3Section() {
  const { data: progressSummary } = useProgressSummarySuspense();
  const big3 = progressSummary.big3;

  if (!big3.latest) {
    return (
      <Big3SummaryCard
        summary={big3}
        emptyMessage={'3대 운동 기록이 없습니다.'}
      />
    );
  }

  const { changes, history } = big3;
  const hasHistory = history.length >= 2;

  const dateRange: [string, string] | undefined = hasHistory
    ? [formatShortDate(history[0].date), formatShortDate(history[history.length - 1].date)]
    : undefined;

  const prLifts = changes
    ? BIG3_LIFT_CONFIG.filter(({ key }) => (changes[key] ?? 0) > 0)
    : [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">
        {'3대 운동'}
      </h3>

      {prLifts.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-500/10 rounded-xl px-4 py-3">
          <TrophyIcon size={18} weight="fill" className="text-amber-500" />
          <span className="text-sm font-medium text-foreground">
            {prLifts
              .map(({ label, key }) => `${label} +${changes![key]}kg`)
              .join(', ')}{' '}
            {'기록 갱신!'}
          </span>
        </div>
      )}

      <Big3SummaryCard
        summary={big3}
        sparklineHeight={48}
        sparklineShowMinMax
        sparklineShowAllDots
        dateRange={dateRange}
        metricGridClassName="grid grid-cols-3 gap-3 pt-3 border-t border-border/20"
      />
    </div>
  );
}
