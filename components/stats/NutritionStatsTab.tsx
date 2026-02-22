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
import type { WeeklyStats } from '@/hooks/routine';
import { useDietaryProfileSuspense } from '@/hooks/dietaryProfile';
import { addDays, formatDate, parseDate } from '@/lib/utils/dateHelpers';
import {
  calculateBalanceScore,
  getBalanceLabel,
} from '@/lib/stats/computations';
import type { MealMetrics } from '@/lib/stats/computations';
import {
  resolveNutritionTargets,
  type NutritionTargets,
} from '@/lib/stats/nutritionTargets';
import {
  DIET_TYPE_LABELS,
  DIETARY_GOAL_LABELS,
} from '@/lib/types/meal';
import PeriodTabs from './PeriodTabs';

const MACRO_COLORS: Record<string, { bg: string; stroke: string }> = {
  탄수화물: { bg: 'bg-amber-400', stroke: '#fbbf24' },
  단백질: { bg: 'bg-primary', stroke: 'var(--color-primary)' },
  지방: { bg: 'bg-rose-400', stroke: '#fb7185' },
};

function getAdherenceColor(percent: number): string {
  if (percent >= 80 && percent <= 120) return 'bg-primary';
  if (percent >= 60 && percent <= 140) return 'bg-warning';
  return 'bg-destructive';
}

function getAdherenceTextColor(percent: number): string {
  if (percent >= 80 && percent <= 120) return 'text-primary';
  if (percent >= 60 && percent <= 140) return 'text-warning';
  return 'text-destructive';
}

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

// ─── Diet Profile Banner ────────────────────────────────────────────────

function DietProfileBanner({ targets }: { targets: NutritionTargets }) {
  return (
    <div className="bg-primary/5 border-l-2 border-primary rounded-r-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        {targets.dietType && (
          <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {DIET_TYPE_LABELS[targets.dietType]}
          </span>
        )}
        {targets.dietaryGoal && (
          <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {DIETARY_GOAL_LABELS[targets.dietaryGoal]}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        일일 목표: {targets.daily.calories.toLocaleString()}kcal · 단백질 {targets.daily.protein}g
      </p>
    </div>
  );
}

// ─── Hero Calorie Card ──────────────────────────────────────────────────

function HeroCalorieCard({
  meal,
  targets,
  comparison,
}: {
  meal: MealMetrics;
  targets: NutritionTargets;
  comparison?: { diff: number; label: string };
}) {
  const isPlannedOnly = meal.completed === 0;
  const calories = isPlannedOnly ? meal.plannedCalories : meal.totalCalories;
  const protein = isPlannedOnly ? meal.plannedProtein : meal.totalProtein;
  const total = meal.completed + meal.scheduled;

  if (calories === 0 && protein === 0 && total === 0) return null;

  const caloriePercent = targets.hasTargets && targets.period.calories > 0
    ? Math.round((calories / targets.period.calories) * 100)
    : null;

  return (
    <div className="bg-card border border-border/30 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">영양 요약</h3>
        <div className="flex items-center gap-2">
          {isPlannedOnly && (
            <span className="text-[10px] text-scheduled bg-scheduled/10 px-1.5 py-0.5 rounded-md">
              예정
            </span>
          )}
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

      {/* 칼로리 메인 수치 */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-bold text-foreground">{calories.toLocaleString()}</span>
        <span className="text-sm text-muted-foreground">kcal</span>
      </div>

      {/* 칼로리 목표 대비 프로그레스바 */}
      {caloriePercent !== null && (
        <div className="mt-2 mb-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getAdherenceColor(caloriePercent)}`}
              style={{ width: `${Math.min(100, caloriePercent)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            목표 {targets.period.calories.toLocaleString()}kcal 중{' '}
            <span className="font-medium text-foreground">{caloriePercent}%</span>
          </p>
        </div>
      )}

      {/* 보조 메트릭 */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-border/20">
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
        {total > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground">달성</p>
            <p className="text-sm font-bold text-foreground">
              {meal.completed}/{total}끼
              <span className="text-[10px] text-muted-foreground font-normal ml-1">
                ({meal.completionRate}%)
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Macro Goal Bars ────────────────────────────────────────────────────

function MacroGoalBars({
  meal,
  targets,
}: {
  meal: MealMetrics;
  targets: NutritionTargets;
}) {
  const macroData = [
    {
      label: '탄수화물',
      actual: meal.totalCarbs,
      target: targets.period.carbs,
      color: MACRO_COLORS['탄수화물'],
    },
    {
      label: '단백질',
      actual: meal.totalProtein,
      target: targets.period.protein,
      color: MACRO_COLORS['단백질'],
    },
    {
      label: '지방',
      actual: meal.totalFat,
      target: targets.period.fat,
      color: MACRO_COLORS['지방'],
    },
  ];

  const balanceScore = calculateBalanceScore(
    { calories: meal.totalCalories, protein: meal.totalProtein, carbs: meal.totalCarbs, fat: meal.totalFat },
    targets.period,
  );
  const { text: balanceText, colorClass } = getBalanceLabel(balanceScore);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">영양소 균형</h3>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted/50 ${colorClass}`}>
          {balanceText} {balanceScore}점
        </span>
      </div>
      <div className="bg-muted/20 rounded-2xl p-4 space-y-4">
        {macroData.map(({ label, actual, target, color }) => {
          const percent = target > 0 ? Math.round((actual / target) * 100) : 0;
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${color.bg}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">{actual}g</span>
                  <span className="text-[10px] text-muted-foreground">/ {target}g</span>
                </div>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getAdherenceColor(percent)}`}
                  style={{ width: `${Math.min(100, Math.max(percent, 2))}%` }}
                />
              </div>
              <div className="flex justify-end mt-0.5">
                <span className={`text-[10px] font-medium ${getAdherenceTextColor(percent)}`}>
                  {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Donut Chart (fallback) ─────────────────────────────────────────────

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

// ─── Daily Calorie Log ──────────────────────────────────────────────────

function DailyCalorieLog({
  dailyStats,
  dailyTarget,
}: {
  dailyStats: WeeklyStats['dailyStats'];
  dailyTarget?: number;
}) {
  const today = formatDate(new Date());
  const calorieValues = dailyStats
    .map((d) => d.mealCalories ?? 0)
    .filter((v) => v > 0);
  const maxCal = Math.max(
    calorieValues.length > 0 ? Math.max(...calorieValues) : 0,
    dailyTarget ?? 0,
  );

  if (maxCal === 0) return null;

  const targetPct = dailyTarget && maxCal > 0 ? (dailyTarget / maxCal) * 100 : null;

  return (
    <div>
      <h3 className="text-sm font-medium text-foreground mb-3">일별 칼로리</h3>
      <div className="bg-muted/20 rounded-2xl p-4 space-y-2.5">
        {dailyStats.map((day) => {
          const isToday = day.date === today;
          const cal = day.mealCalories ?? 0;
          const pct = maxCal > 0 ? (cal / maxCal) * 100 : 0;
          const adherencePercent = dailyTarget && dailyTarget > 0
            ? Math.round((cal / dailyTarget) * 100)
            : null;

          return (
            <div key={day.date} className="flex items-center gap-2.5">
              <span className={`text-xs font-semibold w-5 shrink-0 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {day.dayOfWeek}
              </span>
              <div className="flex-1 h-5 bg-muted/30 rounded-md overflow-hidden relative">
                {cal > 0 && (
                  <div
                    className={`h-full rounded-md transition-all duration-300 ${
                      adherencePercent !== null
                        ? getAdherenceColor(adherencePercent)
                        : isToday ? 'bg-primary' : 'bg-primary/60'
                    }`}
                    style={{ width: `${Math.max(pct, 3)}%` }}
                  />
                )}
                {/* 목표 마커선 */}
                {targetPct !== null && (
                  <div
                    className="absolute top-0 h-full w-0.5 bg-foreground/30"
                    style={{ left: `${Math.min(targetPct, 100)}%` }}
                  />
                )}
              </div>
              <span className={`text-[11px] font-medium w-14 text-right ${cal > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                {cal > 0 ? `${cal.toLocaleString()}` : '-'}
              </span>
            </div>
          );
        })}
        {/* 목표선 범례 */}
        {targetPct !== null && dailyTarget && (
          <div className="flex items-center gap-1.5 pt-1.5">
            <div className="w-3 h-0.5 bg-foreground/30" />
            <span className="text-[10px] text-muted-foreground">
              일일 목표 {dailyTarget.toLocaleString()}kcal
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Full Metrics View ──────────────────────────────────────────────────

function NutritionMetrics({
  meal,
  targets,
  comparison,
  dailyStats,
}: {
  meal: MealMetrics;
  targets: NutritionTargets;
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

  // DonutChart 폴백용 매크로 데이터
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
      {/* 식단 프로필 배너 — 프로필 존재 시만 */}
      {targets.hasTargets && (targets.dietType || targets.dietaryGoal) && (
        <DietProfileBanner targets={targets} />
      )}

      {/* 영양 요약 카드 (elevated) */}
      <HeroCalorieCard meal={meal} targets={targets} comparison={comparison} />

      {/* 영양소 균형: 목표 대비 바 or 비율 도넛 */}
      {targets.hasTargets && macroTotal > 0 ? (
        <MacroGoalBars meal={meal} targets={targets} />
      ) : (
        macros.length >= 2 && <DonutChart macros={macros} />
      )}

      {/* 일별 칼로리 (주간만) */}
      {dailyStats && (
        <DailyCalorieLog
          dailyStats={dailyStats}
          dailyTarget={targets.hasTargets ? targets.daily.calories : undefined}
        />
      )}
    </div>
  );
}

// ─── Period Wrappers ────────────────────────────────────────────────────

function WeeklyNutrition({ dateStr }: { dateStr: string }) {
  const stats = useWeeklyStatsSuspense(dateStr);
  const prevDateStr = formatDate(addDays(new Date(dateStr), -7));
  const prevStats = useWeeklyStatsSuspense(prevDateStr);
  const { data: profile } = useDietaryProfileSuspense();

  if (!stats || (stats.meal.scheduled === 0 && stats.meal.completed === 0)) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <ForkKnifeIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">식단 기록이 없습니다.</p>
      </div>
    );
  }

  const targets = resolveNutritionTargets(stats.meal, profile, 7);
  const comparison = prevStats
    ? { diff: stats.meal.completionRate - prevStats.meal.completionRate, label: '지난주' }
    : undefined;

  return <NutritionMetrics meal={stats.meal} targets={targets} comparison={comparison} dailyStats={stats.dailyStats} />;
}

function MonthlyNutrition({ year, month }: { year: number; month: number }) {
  const stats = useMonthlyStatsSuspense(year, month);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevStats = useMonthlyStatsSuspense(prevYear, prevMonth);
  const { data: profile } = useDietaryProfileSuspense();

  if (!stats || (stats.meal.scheduled === 0 && stats.meal.completed === 0)) {
    return (
      <div className="rounded-2xl bg-muted/20 p-6 text-center">
        <ForkKnifeIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">식단 기록이 없습니다.</p>
      </div>
    );
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const targets = resolveNutritionTargets(stats.meal, profile, daysInMonth);
  const comparison = prevStats
    ? { diff: stats.meal.completionRate - prevStats.meal.completionRate, label: '지난달' }
    : undefined;

  return <NutritionMetrics meal={stats.meal} targets={targets} comparison={comparison} />;
}
