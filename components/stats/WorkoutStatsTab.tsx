'use client';

import { Suspense, type ReactNode } from 'react';
import {
  BarbellIcon,
  ChartLineUpIcon,
  FireIcon,
  PersonSimpleRunIcon,
  TimerIcon,
  TrophyIcon,
} from '@phosphor-icons/react';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';
import ChangeIndicator from '@/components/ui/ChangeIndicator';
import MiniSparkline from '@/components/ui/MiniSparkline';
import { useProgressSummarySuspense } from '@/hooks/progress';
import {
  useMonthlyStatsSuspense,
  useStatsPeriodNavigator,
  useWeeklyStatsSuspense,
} from '@/hooks/routine';
import type { MonthlyStats, WeeklyStats } from '@/hooks/routine';
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
    monthYear,
    label,
    yearLabel,
    canGoNext,
    handlePrev,
    handleNext,
    weekDateStr,
  } = useStatsPeriodNavigator('weekly');

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
    </div>
  );
}

function WeeklyWorkoutMetrics({ dateStr }: { dateStr: string }) {
  const stats = useWeeklyStatsSuspense(dateStr);

  if (!stats || stats.workout.scheduled === 0) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <BarbellIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">예정된 운동이 없습니다.</p>
      </div>
    );
  }

  const metrics = buildWorkoutMetrics(stats.workout);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-muted/20 rounded-xl px-4 py-3">
        <BarbellIcon size={18} weight="fill" className="text-primary" />
        <span className="text-sm font-medium text-foreground">
          {stats.workout.completed + stats.workout.scheduled}개 중{' '}
          <span className="text-primary">{stats.workout.completed}개</span> 완료
        </span>
        <span className="ml-auto text-sm font-bold text-primary">
          {stats.workout.completionRate}%
        </span>
      </div>

      <WorkoutMetricsGrid metrics={metrics} />
    </div>
  );
}

function MonthlyWorkoutMetrics({ year, month }: { year: number; month: number }) {
  const stats = useMonthlyStatsSuspense(year, month);

  if (!stats || stats.workout.scheduled === 0) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <BarbellIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">예정된 운동이 없습니다.</p>
      </div>
    );
  }

  const metrics = buildWorkoutMetrics(stats.workout);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-muted/20 rounded-xl px-4 py-3">
        <BarbellIcon size={18} weight="fill" className="text-primary" />
        <span className="text-sm font-medium text-foreground">
          {stats.workout.completed + stats.workout.scheduled}개 중{' '}
          <span className="text-primary">{stats.workout.completed}개</span> 완료
        </span>
        <span className="ml-auto text-sm font-bold text-primary">
          {stats.workout.completionRate}%
        </span>
      </div>

      <WorkoutMetricsGrid metrics={metrics} />
    </div>
  );
}

const LIFT_CONFIG = [
  { key: 'squat', label: '스쿼트' },
  { key: 'bench', label: '벤치프레스' },
  { key: 'deadlift', label: '데드리프트' },
] as const;

function Big3Section() {
  const { data: progressSummary } = useProgressSummarySuspense();
  const big3 = progressSummary.big3;

  if (!big3.latest) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <BarbellIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">3대 운동 기록이 없습니다.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          스쿼트·벤치프레스·데드리프트를 수행하면 자동으로 추적됩니다.
        </p>
      </div>
    );
  }

  const { latest, changes, history } = big3;
  const hasHistory = history.length >= 2;
  const sparklineData = history.map((point) => point.total);

  const dateRange: [string, string] | undefined = hasHistory
    ? [formatShortDate(history[0].date), formatShortDate(history[history.length - 1].date)]
    : undefined;

  const prLifts = changes
    ? LIFT_CONFIG.filter(({ key }) => (changes[key] ?? 0) > 0)
    : [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">3대 운동</h3>

      {prLifts.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-500/10 rounded-xl px-4 py-3">
          <TrophyIcon size={18} weight="fill" className="text-amber-500" />
          <span className="text-sm font-medium text-foreground">
            {prLifts
              .map(({ label, key }) => `${label} +${changes![key]}kg`)
              .join(', ')}{' '}
            기록 갱신!
          </span>
        </div>
      )}

      <div className="bg-muted/20 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="shrink-0">
            <p className="text-[11px] text-muted-foreground mb-0.5">합계</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{latest.total}</span>
              <span className="text-xs text-muted-foreground">kg</span>
              {changes && changes.total !== 0 && (
                <ChangeIndicator value={changes.total} positiveIsGood />
              )}
            </div>
          </div>
          {hasHistory && (
            <div className="flex-1 min-w-0">
              <MiniSparkline data={sparklineData} height={48} showMinMax showAllDots dateRange={dateRange} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/20">
          {LIFT_CONFIG.map(({ key, label }) => {
            const value = latest[key];
            const change = changes?.[key];

            return (
              <div key={key} className="text-center">
                <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
                <p className="text-sm font-bold text-foreground">
                  {value != null ? (
                    <>
                      {value}
                      <span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/50">-</span>
                  )}
                </p>
                {change != null && change !== 0 && (
                  <ChangeIndicator value={change} positiveIsGood />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
