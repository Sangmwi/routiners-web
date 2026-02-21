'use client';

import { Suspense } from 'react';
import { ForkKnifeIcon } from '@phosphor-icons/react';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';
import {
  useMonthlyStatsSuspense,
  useStatsPeriodNavigator,
  useWeeklyStatsSuspense,
} from '@/hooks/routine';
import type { MonthlyStats, WeeklyStats } from '@/hooks/routine';
import PeriodTabs from './PeriodTabs';

export default function NutritionStatsTab() {
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
              <WeeklyNutrition dateStr={weekDateStr} />
            ) : (
              <MonthlyNutrition year={monthYear.year} month={monthYear.month} />
            )}
          </Suspense>
        </QueryErrorBoundary>
      </div>
    </div>
  );
}

function NutritionMetrics({ meal }: { meal: WeeklyStats['meal'] | MonthlyStats['meal'] }) {
  const isPlannedOnly = meal.completed === 0;

  const mainMetrics: { label: string; value: string }[] = [];
  if (meal.totalCalories > 0) {
    mainMetrics.push({ label: '총 칼로리', value: `${meal.totalCalories.toLocaleString()}kcal` });
  } else if (meal.plannedCalories > 0) {
    mainMetrics.push({ label: '예상 칼로리', value: `${meal.plannedCalories.toLocaleString()}kcal` });
  }

  if (meal.totalProtein > 0) {
    mainMetrics.push({ label: '총 단백질', value: `${meal.totalProtein}g` });
  } else if (meal.plannedProtein > 0) {
    mainMetrics.push({ label: '예상 단백질', value: `${meal.plannedProtein}g` });
  }

  if (meal.avgCalories > 0) {
    mainMetrics.push({ label: '평균 칼로리', value: `${meal.avgCalories.toLocaleString()}kcal` });
  }

  const macros: { label: string; value: number; unit: string }[] = [];
  if (meal.totalCarbs > 0) macros.push({ label: '탄수화물', value: meal.totalCarbs, unit: 'g' });
  if (meal.totalProtein > 0) macros.push({ label: '단백질', value: meal.totalProtein, unit: 'g' });
  if (meal.totalFat > 0) macros.push({ label: '지방', value: meal.totalFat, unit: 'g' });

  const macroTotal = macros.reduce((sum, macro) => sum + macro.value, 0);
  const hasMacros = macros.length >= 2 && macroTotal > 0;

  if (mainMetrics.length === 0) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <ForkKnifeIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">식단 데이터가 없습니다.</p>
      </div>
    );
  }

  const gridCols = (count: number) => (count <= 1 ? 'grid-cols-1' : count === 2 ? 'grid-cols-2' : 'grid-cols-3');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-muted/20 rounded-xl px-4 py-3">
        <ForkKnifeIcon size={18} weight="fill" className="text-primary" />
        <span className="text-sm font-medium text-foreground">
          {meal.completed + meal.scheduled}개 중 <span className="text-primary">{meal.completed}개</span> 완료
        </span>
        <span className="ml-auto text-sm font-bold text-primary">{meal.completionRate}%</span>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-sm font-medium text-foreground">영양 요약</h3>
          {isPlannedOnly && meal.plannedCalories > 0 && (
            <span className="text-[10px] text-scheduled bg-scheduled/10 px-1.5 py-0.5 rounded-md">
              예정
            </span>
          )}
        </div>
        <div className="bg-muted/20 rounded-2xl p-4">
          <div className={`grid ${gridCols(mainMetrics.length)} gap-3`}>
            {mainMetrics.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                <p className="text-base font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {hasMacros && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">매크로 비율</h3>
          <div className="bg-muted/20 rounded-2xl p-4 space-y-3">
            <div className="h-3 rounded-full overflow-hidden flex">
              {macros.map(({ label, value }) => {
                const pct = Math.round((value / macroTotal) * 100);
                const colors: Record<string, string> = {
                  탄수화물: 'bg-amber-400',
                  단백질: 'bg-primary',
                  지방: 'bg-rose-400',
                };
                return (
                  <div
                    key={label}
                    className={`${colors[label] ?? 'bg-muted'} transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>

            <div className={`grid ${gridCols(macros.length)} gap-3`}>
              {macros.map(({ label, value, unit }) => {
                const pct = Math.round((value / macroTotal) * 100);
                const dotColors: Record<string, string> = {
                  탄수화물: 'bg-amber-400',
                  단백질: 'bg-primary',
                  지방: 'bg-rose-400',
                };
                return (
                  <div key={label} className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className={`w-2 h-2 rounded-full ${dotColors[label] ?? 'bg-muted'}`} />
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {value}
                      {unit}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeeklyNutrition({ dateStr }: { dateStr: string }) {
  const stats = useWeeklyStatsSuspense(dateStr);

  if (!stats || stats.meal.scheduled === 0) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <ForkKnifeIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">예정된 식단이 없습니다.</p>
      </div>
    );
  }

  return <NutritionMetrics meal={stats.meal} />;
}

function MonthlyNutrition({ year, month }: { year: number; month: number }) {
  const stats = useMonthlyStatsSuspense(year, month);

  if (!stats || stats.meal.scheduled === 0) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <ForkKnifeIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">예정된 식단이 없습니다.</p>
      </div>
    );
  }

  return <NutritionMetrics meal={stats.meal} />;
}
