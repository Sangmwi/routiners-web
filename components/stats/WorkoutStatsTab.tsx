'use client';

import { Suspense, useState } from 'react';

import {
  BarbellIcon,
  ChartLineUpIcon,
  FireIcon,
  ListBulletsIcon,
  PersonSimpleRunIcon,
  TimerIcon,
  TrophyIcon,
} from '@phosphor-icons/react';
import EmptyState from '@/components/common/EmptyState';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { Big3SummaryCard } from '@/components/progress/Big3SummaryCard';
import ProgressRateBar from '@/components/ui/ProgressRateBar';
import { PulseLoader } from '@/components/ui/PulseLoader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useProgressSummarySuspense } from '@/hooks/progress';
import {
  useMonthlyStatsSuspense,
  useWeeklyStatsSuspense,
} from '@/hooks/routine';
import { BIG3_LIFT_CONFIG } from '@/lib/constants/big3';
import { addDays, formatDate } from '@/lib/utils/dateHelpers';
import type { MonthlyStats, WeeklyStats } from '@/hooks/routine';
import type { UseStatsPeriodNavigatorReturn } from '@/hooks/routine/useStatsPeriodNavigator';
import StatsTabShell from './StatsTabShell';

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

type SummaryMode = 'total' | 'average';

const SUMMARY_MODE_OPTIONS = [
  { key: 'total' as const, label: '총합' },
  { key: 'average' as const, label: '평균' },
];

function WorkoutSummarySection({
  workout,
}: {
  workout: WeeklyStats['workout'] | MonthlyStats['workout'];
}) {
  const [mode, setMode] = useState<SummaryMode>('total');

  const isPlannedOnly = workout.completed === 0;
  const completed = workout.completed || 1;

  // 4번째 슬롯: distance > 0이면 거리, 아니면 세트
  const hasDistance = workout.totalDistance > 0 || workout.plannedDistance > 0;

  const metrics = [
    {
      icon: <TimerIcon size={18} weight={isPlannedOnly ? 'duotone' : 'fill'} className={isPlannedOnly ? 'text-muted-foreground' : 'text-primary'} />,
      label: mode === 'total' ? '운동시간' : '평균 운동시간',
      total: isPlannedOnly ? workout.plannedDuration : workout.totalDuration,
      avg: Math.round((isPlannedOnly ? workout.plannedDuration : workout.totalDuration) / completed),
      format: (v: number) => `${v.toLocaleString()}`,
      unit: '분',
    },
    {
      icon: <FireIcon size={18} weight={isPlannedOnly ? 'duotone' : 'fill'} className={isPlannedOnly ? 'text-muted-foreground' : 'text-primary'} />,
      label: mode === 'total' ? '소모 칼로리' : '평균 소모',
      total: isPlannedOnly ? workout.plannedCaloriesBurned : workout.totalCaloriesBurned,
      avg: Math.round((isPlannedOnly ? workout.plannedCaloriesBurned : workout.totalCaloriesBurned) / completed),
      format: (v: number) => `${v.toLocaleString()}`,
      unit: 'kcal',
    },
    {
      icon: <ChartLineUpIcon size={18} weight={isPlannedOnly ? 'duotone' : 'fill'} className={isPlannedOnly ? 'text-muted-foreground' : 'text-primary'} />,
      label: mode === 'total' ? '볼륨' : '평균 볼륨',
      total: isPlannedOnly ? workout.plannedVolume : workout.totalVolume,
      avg: Math.round((isPlannedOnly ? workout.plannedVolume : workout.totalVolume) / completed),
      format: (v: number) => `${v.toLocaleString()}`,
      unit: 'kg',
    },
    hasDistance
      ? {
          icon: <PersonSimpleRunIcon size={18} weight={isPlannedOnly ? 'duotone' : 'fill'} className={isPlannedOnly ? 'text-muted-foreground' : 'text-primary'} />,
          label: mode === 'total' ? '유산소 거리' : '평균 거리',
          total: isPlannedOnly ? workout.plannedDistance : workout.totalDistance,
          avg: Number(((isPlannedOnly ? workout.plannedDistance : workout.totalDistance) / completed).toFixed(1)),
          format: (v: number) => `${v.toFixed(1)}`,
          unit: 'km',
        }
      : {
          icon: <ListBulletsIcon size={18} weight={isPlannedOnly ? 'duotone' : 'fill'} className={isPlannedOnly ? 'text-muted-foreground' : 'text-primary'} />,
          label: mode === 'total' ? '세트' : '평균 세트',
          total: isPlannedOnly ? workout.plannedSets : workout.totalSets,
          avg: Number(((isPlannedOnly ? workout.plannedSets : workout.totalSets) / completed).toFixed(1)),
          format: (v: number) => Number.isInteger(v) ? `${v}` : `${v.toFixed(1)}`,
          unit: '세트',
        },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-medium text-foreground">운동 요약</h3>
          {isPlannedOnly && (
            <span className="text-xs text-scheduled bg-surface-scheduled px-1.5 py-0.5 rounded-md">
              예정
            </span>
          )}
        </div>
        <SegmentedControl
          options={SUMMARY_MODE_OPTIONS}
          value={mode}
          onChange={setMode}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map(({ icon, label, total, avg, format, unit }) => {
          const value = mode === 'total' ? total : avg;
          return (
            <div key={label} className="bg-surface-secondary rounded-2xl p-4">
              <div className="flex items-center gap-2.5 mb-2.5">
                {icon}
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {value > 0 ? format(value) : '-'}
                {value > 0 && (
                  <span className="text-xs font-normal text-muted-foreground ml-0.5">
                    {unit}{mode === 'average' && '/일'}
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WorkoutStatsTab({ navigator }: { navigator: UseStatsPeriodNavigatorReturn }) {
  return (
    <StatsTabShell
      navigator={navigator}
      weeklyContent={(dateStr) => <WeeklyWorkoutMetrics dateStr={dateStr} />}
      monthlyContent={(year, month) => <MonthlyWorkoutMetrics year={year} month={month} />}
    >
      <div className="mt-8">
        <QueryErrorBoundary>
          <Suspense fallback={<PulseLoader />}>
            <Big3Section />
          </Suspense>
        </QueryErrorBoundary>
      </div>
    </StatsTabShell>
  );
}

function WeeklyWorkoutMetrics({ dateStr }: { dateStr: string }) {
  const stats = useWeeklyStatsSuspense(dateStr);
  const prevDateStr = formatDate(addDays(new Date(dateStr), -7));
  const prevStats = useWeeklyStatsSuspense(prevDateStr);

  const workoutTotal = stats.workout.completed + stats.workout.scheduled;

  if (!stats || workoutTotal === 0) {
    return <EmptyState icon={BarbellIcon} message="운동 기록이 없습니다." className="rounded-2xl bg-surface-secondary" />;
  }

  const comparison = prevStats && (prevStats.workout.completed + prevStats.workout.scheduled) > 0
    ? { diff: stats.workout.completionRate - prevStats.workout.completionRate, label: '지난주' }
    : undefined;

  return (
    <div className="space-y-8">
      <ProgressRateBar
        icon={BarbellIcon}
        label="운동"
        completionRate={stats.workout.completionRate}
        completed={stats.workout.completed}
        total={workoutTotal}
        comparison={comparison}
      />
      <WorkoutSummarySection workout={stats.workout} />
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
    return <EmptyState icon={BarbellIcon} message="운동 기록이 없습니다." className="rounded-2xl bg-surface-secondary" />;
  }

  const comparison = prevStats && (prevStats.workout.completed + prevStats.workout.scheduled) > 0
    ? { diff: stats.workout.completionRate - prevStats.workout.completionRate, label: '지난달' }
    : undefined;

  return (
    <div className="space-y-8">
      <ProgressRateBar
        icon={BarbellIcon}
        label="운동"
        completionRate={stats.workout.completionRate}
        completed={stats.workout.completed}
        total={workoutTotal}
        comparison={comparison}
      />
      <WorkoutSummarySection workout={stats.workout} />
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
      <h3 className="text-base font-medium text-foreground">
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
        metricGridClassName="grid grid-cols-3 gap-3 pt-3 border-t border-edge-divider"
      />
    </div>
  );
}
