'use client';

import { Suspense, useState } from 'react';
import { ForkKnifeIcon } from '@phosphor-icons/react';
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

const MACRO_COLORS: Record<string, { bg: string; stroke: string }> = {
  탄수화물: { bg: 'bg-amber-400', stroke: '#fbbf24' },
  단백질: { bg: 'bg-primary', stroke: 'var(--color-primary)' },
  지방: { bg: 'bg-rose-400', stroke: '#fb7185' },
};

export default function NutritionStatsTab() {
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
              <WeeklyNutrition dateStr={weekDateStr} />
            ) : (
              <MonthlyNutrition year={monthYear.year} month={monthYear.month} />
            )}
          </Suspense>
        </QueryErrorBoundary>
      </div>

      {period === 'weekly' ? (
        <DateJumpSheet
          key={`nutrition-date-${dateJumpSession}`}
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
          key={`nutrition-month-${dateJumpSession}`}
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

// ─── Completion Card ──────────────────────────────────────────────────────

function NutritionCompletionCard({
  meal,
  comparison,
}: {
  meal: WeeklyStats['meal'] | MonthlyStats['meal'];
  comparison?: { diff: number; label: string };
}) {
  const total = meal.completed + meal.scheduled;
  return (
    <div className="bg-muted/20 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <ForkKnifeIcon size={16} weight="fill" className="text-primary" />
        <span className="text-xs font-medium text-muted-foreground">달성률</span>
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
          {total > 0 ? `${meal.completed}/${total}개 완료` : '일정 없음'}
        </p>
        {comparison && comparison.diff !== 0 && (
          <span className="text-[10px] font-medium">
            <span className={comparison.diff > 0 ? 'text-positive' : 'text-negative'}>
              {comparison.diff > 0 ? '▲' : '▼'}
              {Math.abs(comparison.diff)}%
            </span>
            <span className="text-muted-foreground"> {comparison.label} 대비</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Hero Calorie Card ────────────────────────────────────────────────────

function HeroCalorieCard({ meal }: { meal: WeeklyStats['meal'] | MonthlyStats['meal'] }) {
  const isPlannedOnly = meal.completed === 0;
  const calories = isPlannedOnly ? meal.plannedCalories : meal.totalCalories;
  const protein = isPlannedOnly ? meal.plannedProtein : meal.totalProtein;

  if (calories === 0 && protein === 0) return null;

  return (
    <div className="bg-muted/20 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <h3 className="text-sm font-medium text-foreground">영양 요약</h3>
        {isPlannedOnly && (
          <span className="text-[10px] text-scheduled bg-scheduled/10 px-1.5 py-0.5 rounded-md">
            예정
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold text-foreground">{calories.toLocaleString()}</span>
        <span className="text-sm text-muted-foreground">kcal</span>
      </div>
      <div className="flex gap-4 mt-2">
        {protein > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground">단백질</p>
            <p className="text-sm font-bold text-foreground">{protein}g</p>
          </div>
        )}
        {meal.avgCalories > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground">일 평균</p>
            <p className="text-sm font-bold text-foreground">{meal.avgCalories.toLocaleString()}kcal</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────

function DonutChart({
  macros,
}: {
  macros: { label: string; value: number; pct: number }[];
}) {
  const size = 100;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const chartSegments = macros.map(({ label, pct }, index) => {
    const dashLength = (pct / 100) * circumference;
    const accumulatedLength = macros
      .slice(0, index)
      .reduce((sum, current) => sum + (current.pct / 100) * circumference, 0);

    return {
      label,
      dashLength,
      dashOffset: circumference * 0.25 - accumulatedLength,
      color: MACRO_COLORS[label]?.stroke ?? '#888',
    };
  });

  return (
    <div>
      <h3 className="text-sm font-medium text-foreground mb-3">3대 영양소</h3>
      <div className="bg-muted/20 rounded-2xl p-4">
        <div className="flex items-center gap-6">
          {/* SVG Donut */}
          <div className="shrink-0">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/30"
              />
              {chartSegments.map(({ label, dashLength, dashOffset, color }) => (
                <circle
                  key={label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-500"
                />
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2.5">
            {macros.map(({ label, value, pct }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${MACRO_COLORS[label]?.bg ?? 'bg-muted'}`} />
                <span className="text-xs text-muted-foreground flex-1">{label}</span>
                <span className="text-xs font-bold text-foreground">{value}g</span>
                <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Daily Calorie Log ────────────────────────────────────────────────────

function DailyCalorieLog({ dailyStats }: { dailyStats: WeeklyStats['dailyStats'] }) {
  const today = formatDate(new Date());
  const calorieValues = dailyStats
    .map((d) => d.mealCalories ?? 0)
    .filter((v) => v > 0);
  const maxCal = calorieValues.length > 0 ? Math.max(...calorieValues) : 0;

  if (maxCal === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-foreground mb-3">일별 칼로리</h3>
      <div className="bg-muted/20 rounded-2xl p-4 space-y-2.5">
        {dailyStats.map((day) => {
          const isToday = day.date === today;
          const cal = day.mealCalories ?? 0;
          const pct = maxCal > 0 ? (cal / maxCal) * 100 : 0;

          return (
            <div key={day.date} className="flex items-center gap-2.5">
              <span className={`text-xs font-semibold w-5 shrink-0 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {day.dayOfWeek}
              </span>
              <div className="flex-1 h-5 bg-muted/30 rounded-md overflow-hidden">
                {cal > 0 && (
                  <div
                    className={`h-full rounded-md transition-all duration-300 ${isToday ? 'bg-primary' : 'bg-primary/60'}`}
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  />
                )}
              </div>
              <span className={`text-[11px] font-medium w-14 text-right ${cal > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                {cal > 0 ? `${cal.toLocaleString()}` : '-'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Full Metrics View ────────────────────────────────────────────────────

function NutritionMetrics({
  meal,
  comparison,
  dailyStats,
}: {
  meal: WeeklyStats['meal'] | MonthlyStats['meal'];
  comparison?: { diff: number; label: string };
  dailyStats?: WeeklyStats['dailyStats'];
}) {
  if (meal.totalCalories === 0 && meal.plannedCalories === 0 && meal.totalProtein === 0 && meal.plannedProtein === 0) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <ForkKnifeIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">식단 데이터가 없습니다.</p>
      </div>
    );
  }

  const macros: { label: string; value: number; pct: number }[] = [];
  const totalCarbs = meal.totalCarbs || 0;
  const totalProtein = meal.totalProtein || 0;
  const totalFat = meal.totalFat || 0;
  const macroTotal = totalCarbs + totalProtein + totalFat;

  if (macroTotal > 0) {
    if (totalCarbs > 0) macros.push({ label: '탄수화물', value: totalCarbs, pct: Math.round((totalCarbs / macroTotal) * 100) });
    if (totalProtein > 0) macros.push({ label: '단백질', value: totalProtein, pct: Math.round((totalProtein / macroTotal) * 100) });
    if (totalFat > 0) macros.push({ label: '지방', value: totalFat, pct: Math.round((totalFat / macroTotal) * 100) });
  }

  return (
    <div className="space-y-6">
      <NutritionCompletionCard meal={meal} comparison={comparison} />
      <HeroCalorieCard meal={meal} />
      {macros.length >= 2 && <DonutChart macros={macros} />}
      {dailyStats && <DailyCalorieLog dailyStats={dailyStats} />}
    </div>
  );
}

// ─── Period Wrappers ──────────────────────────────────────────────────────

function WeeklyNutrition({ dateStr }: { dateStr: string }) {
  const stats = useWeeklyStatsSuspense(dateStr);
  const prevDateStr = formatDate(addDays(new Date(dateStr), -7));
  const prevStats = useWeeklyStatsSuspense(prevDateStr);

  if (!stats || (stats.meal.scheduled === 0 && stats.meal.completed === 0)) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <ForkKnifeIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">식단 기록이 없습니다.</p>
      </div>
    );
  }

  const comparison = prevStats
    ? { diff: stats.meal.completionRate - prevStats.meal.completionRate, label: '지난주' }
    : undefined;

  return <NutritionMetrics meal={stats.meal} comparison={comparison} dailyStats={stats.dailyStats} />;
}

function MonthlyNutrition({ year, month }: { year: number; month: number }) {
  const stats = useMonthlyStatsSuspense(year, month);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevStats = useMonthlyStatsSuspense(prevYear, prevMonth);

  if (!stats || (stats.meal.scheduled === 0 && stats.meal.completed === 0)) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <ForkKnifeIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">식단 기록이 없습니다.</p>
      </div>
    );
  }

  const comparison = prevStats
    ? { diff: stats.meal.completionRate - prevStats.meal.completionRate, label: '지난달' }
    : undefined;

  return <NutritionMetrics meal={stats.meal} comparison={comparison} />;
}
