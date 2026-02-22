'use client';

import { Suspense, useState } from 'react';
import { CheckCircleIcon, ClockIcon, FireIcon, ForkKnifeIcon, XCircleIcon } from '@phosphor-icons/react';
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
import { MACRO_RATIOS, DEFAULT_MACRO_RATIO } from '@/lib/utils/tdee';
import { getDisplayStatus } from '@/lib/config/theme';
import PeriodTabs from './PeriodTabs';

const MACRO_COLORS: Record<string, { bg: string; stroke: string }> = {
  탄수화물: { bg: 'bg-amber-400', stroke: '#fbbf24' },
  단백질: { bg: 'bg-sky-400', stroke: '#38bdf8' },
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

// ─── Insight Generator ────────────────────────────────────────────────

function generateNutritionInsight(meal: MealMetrics, targets: NutritionTargets): string | null {
  if (!targets.hasTargets || targets.period.calories === 0) return null;

  const macros = [
    { name: '단백질', pct: targets.period.protein > 0 ? (meal.totalProtein / targets.period.protein) * 100 : 100 },
    { name: '탄수화물', pct: targets.period.carbs > 0 ? (meal.totalCarbs / targets.period.carbs) * 100 : 100 },
    { name: '지방', pct: targets.period.fat > 0 ? (meal.totalFat / targets.period.fat) * 100 : 100 },
  ];

  const worst = macros.reduce((a, b) => Math.abs(a.pct - 100) > Math.abs(b.pct - 100) ? a : b);
  const deviation = Math.abs(worst.pct - 100);
  if (deviation < 15) return null;

  return worst.pct > 100
    ? `${worst.name} 섭취가 목표보다 ${Math.round(worst.pct - 100)}% 높아요`
    : `${worst.name}이 목표보다 ${Math.round(100 - worst.pct)}% 부족해요`;
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
  const ratio = targets.dietType
    ? (MACRO_RATIOS[targets.dietType] ?? DEFAULT_MACRO_RATIO)
    : DEFAULT_MACRO_RATIO;

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
        일일 목표: {targets.daily.calories.toLocaleString()}kcal · 단백질 {targets.daily.protein}g · 탄:단:지 {Math.round(ratio.carbs * 100)}:{Math.round(ratio.protein * 100)}:{Math.round(ratio.fat * 100)}
      </p>
    </div>
  );
}

// ─── Calorie Summary Card (hero = 일 평균) ──────────────────────────────

function CalorieSummaryCard({
  meal,
  targets,
  comparison,
}: {
  meal: MealMetrics;
  targets: NutritionTargets;
  comparison?: { diff: number; label: string };
}) {
  const isPlannedOnly = meal.completed === 0;
  const total = meal.completed + meal.scheduled;

  // hero = 일 평균 (예정만이면 총합)
  const heroCalories = isPlannedOnly ? meal.plannedCalories : meal.avgCalories;
  const totalCalories = isPlannedOnly ? meal.plannedCalories : meal.totalCalories;

  if (heroCalories === 0 && totalCalories === 0 && total === 0) return null;

  // 프로그레스바: 일 평균 vs 일일 목표
  const caloriePercent = targets.hasTargets && targets.daily.calories > 0 && !isPlannedOnly
    ? Math.round((heroCalories / targets.daily.calories) * 100)
    : null;

  return (
    <div>
      {/* 상단: 예정 배지 + 비교 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isPlannedOnly && (
            <span className="text-[10px] text-scheduled bg-scheduled/10 px-1.5 py-0.5 rounded-md">
              예정
            </span>
          )}
        </div>
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

      {/* hero: 일 평균 칼로리 */}
      <div className="flex items-center gap-2 mb-1">
        <FireIcon size={28} weight="fill" className="text-orange-400" />
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{heroCalories.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">kcal</span>
        </div>
      </div>

      {/* 프로그레스바: 일 평균 vs 일일 목표 */}
      {caloriePercent !== null && (
        <div className="mt-2 mb-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getAdherenceColor(caloriePercent)}`}
              style={{ width: `${Math.min(100, caloriePercent)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            목표 {targets.daily.calories.toLocaleString()}kcal의{' '}
            <span className="font-medium text-foreground">{caloriePercent}%</span>
          </p>
        </div>
      )}

      {/* 보조: 총 섭취 + 달성 */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-border/20">
        {totalCalories > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground">총 섭취</p>
            <p className="text-sm font-bold text-foreground">
              {totalCalories.toLocaleString()}kcal
            </p>
          </div>
        )}
        {total > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground">달성</p>
            <p className="text-sm font-bold text-foreground">
              {meal.completed}/{total}일
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

// ─── Nutrition Balance Section (매크로 바 + 점수 + 인사이트 통합) ────────

function NutritionBalanceSection({
  meal,
  targets,
  prevMeal,
}: {
  meal: MealMetrics;
  targets: NutritionTargets;
  prevMeal?: MealMetrics;
}) {
  const score = calculateBalanceScore(
    { calories: meal.totalCalories, protein: meal.totalProtein, carbs: meal.totalCarbs, fat: meal.totalFat },
    targets.period,
  );
  const { text: balanceText, colorClass } = getBalanceLabel(score);
  const insight = generateNutritionInsight(meal, targets);

  const completed = meal.completed || 1;

  const macroData = [
    {
      label: '단백질',
      avgActual: Math.round(meal.totalProtein / completed),
      dailyTarget: targets.daily.protein,
      prevAvg: prevMeal ? Math.round(prevMeal.totalProtein / (prevMeal.completed || 1)) : undefined,
      percent: targets.period.protein > 0 ? Math.round((meal.totalProtein / targets.period.protein) * 100) : 0,
      color: MACRO_COLORS['단백질'],
    },
    {
      label: '탄수화물',
      avgActual: Math.round(meal.totalCarbs / completed),
      dailyTarget: targets.daily.carbs,
      prevAvg: prevMeal ? Math.round(prevMeal.totalCarbs / (prevMeal.completed || 1)) : undefined,
      percent: targets.period.carbs > 0 ? Math.round((meal.totalCarbs / targets.period.carbs) * 100) : 0,
      color: MACRO_COLORS['탄수화물'],
    },
    {
      label: '지방',
      avgActual: Math.round(meal.totalFat / completed),
      dailyTarget: targets.daily.fat,
      prevAvg: prevMeal ? Math.round(prevMeal.totalFat / (prevMeal.completed || 1)) : undefined,
      percent: targets.period.fat > 0 ? Math.round((meal.totalFat / targets.period.fat) * 100) : 0,
      color: MACRO_COLORS['지방'],
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">영양소 균형</h3>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted/50 ${colorClass}`}>
          {balanceText} {score}점
        </span>
      </div>
      <div className="space-y-4">
        {macroData.map(({ label, avgActual, dailyTarget, prevAvg, percent, color }) => {
          const change = prevAvg != null ? avgActual - prevAvg : undefined;
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${color.bg}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">일 평균</span>
                  <span className="text-xs font-bold text-foreground">{avgActual}g</span>
                  <span className="text-[10px] text-muted-foreground">/ {dailyTarget}g</span>
                  {change != null && change !== 0 && (
                    <span className={`text-[10px] font-medium ${change > 0 ? 'text-positive' : 'text-negative'}`}>
                      {change > 0 ? '+' : ''}{change}g
                    </span>
                  )}
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
        {/* 인사이트 */}
        {insight && (
          <div className="pt-3 border-t border-border/20">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">💡</span> {insight}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Donut Chart (fallback, 프로필 없을 때) ─────────────────────────────

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
      <div>
        <div className="flex items-center gap-6">
          {/* SVG Donut */}
          <div className="shrink-0">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
          <div className="flex-1 space-y-3.5">
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
        <p className="text-[10px] text-muted-foreground/40 mt-6 text-center">
          일반 권장 비율: 탄 50 · 단 30 · 지 20
        </p>
      </div>
    </div>
  );
}

// ─── Daily Nutrition Log (메트릭 필터 토글) ─────────────────────────────

type DailyMetric = 'calories' | 'protein' | 'carbs' | 'fat';

const DAILY_METRIC_OPTIONS: { key: DailyMetric; label: string; unit: string; barColor: string; barColorMuted: string }[] = [
  { key: 'calories', label: '칼로리', unit: 'kcal', barColor: 'bg-orange-400', barColorMuted: 'bg-orange-400/40' },
  { key: 'protein', label: '단백질', unit: 'g', barColor: 'bg-sky-400', barColorMuted: 'bg-sky-400/40' },
  { key: 'carbs', label: '탄수화물', unit: 'g', barColor: 'bg-amber-400', barColorMuted: 'bg-amber-400/40' },
  { key: 'fat', label: '지방', unit: 'g', barColor: 'bg-rose-400', barColorMuted: 'bg-rose-400/40' },
];

function getDailyValue(day: WeeklyStats['dailyStats'][number], metric: DailyMetric): number {
  switch (metric) {
    case 'calories': return day.mealCalories ?? 0;
    case 'protein': return day.mealProtein ?? 0;
    case 'carbs': return day.mealCarbs ?? 0;
    case 'fat': return day.mealFat ?? 0;
  }
}

function DailyNutritionLog({
  dailyStats,
  dailyTargets,
}: {
  dailyStats: WeeklyStats['dailyStats'];
  dailyTargets?: { calories: number; protein: number; carbs: number; fat: number };
}) {
  const [metric, setMetric] = useState<DailyMetric>('calories');
  const today = formatDate(new Date());

  const metricOption = DAILY_METRIC_OPTIONS.find((o) => o.key === metric)!;
  const dailyTarget = dailyTargets?.[metric] ?? 0;

  const values = dailyStats.map((d) => getDailyValue(d, metric)).filter((v) => v > 0);
  const maxVal = Math.max(
    values.length > 0 ? Math.max(...values) : 0,
    dailyTarget,
  );

  if (maxVal === 0) return null;

  const targetPct = dailyTarget > 0 && maxVal > 0 ? (dailyTarget / maxVal) * 100 : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">일별 기록</h3>
        {/* 메트릭 필터 */}
        <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
          {DAILY_METRIC_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMetric(key)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
                metric === key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl py-4 px-2 space-y-2.5">
        {dailyStats.map((day) => {
          const isToday = day.date === today;
          const val = getDailyValue(day, metric);
          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;

          const formatted = val > 0
            ? metric === 'calories' ? `${val.toLocaleString()}kcal` : `${val}g`
            : '';

          // 상태: completed / scheduled / incomplete / null
          const displayStatus = day.meal
            ? getDisplayStatus(day.meal, day.date)
            : null;

          // 완료된 날 = 진한 색, 나머지 = 연한 색
          const barColorClass = displayStatus === 'completed'
            ? metricOption.barColor
            : metricOption.barColorMuted;

          return (
            <div key={day.date} className="flex items-center gap-1.5">
              {/* 상태 아이콘 (왼쪽) */}
              <span className="w-4 shrink-0 flex justify-center">
                {displayStatus === 'completed' && (
                  <CheckCircleIcon size={13} weight="fill" className="text-primary" />
                )}
                {displayStatus === 'scheduled' && (
                  <ClockIcon size={13} weight="duotone" className="text-scheduled" />
                )}
                {displayStatus === 'incomplete' && (
                  <XCircleIcon size={13} weight="fill" className="text-muted-foreground/30" />
                )}
                {displayStatus === null && (
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/15" />
                )}
              </span>
              {/* 요일 */}
              <span className={`text-xs font-semibold w-5 shrink-0 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {day.dayOfWeek}
              </span>
              {/* 바 + 수치 묶음 (flex-grow 비율로 분배) */}
              <div className={`flex-1 min-w-0 h-5 rounded-md relative flex items-center overflow-hidden ${val > 0 ? '' : 'bg-muted/30'}`}>
                {/* 채워진 바 */}
                {val > 0 && (
                  <div
                    className={`h-full rounded-md transition-all duration-300 ${barColorClass}`}
                    style={{ flex: `${Math.max(pct, 3)} 1 0px` }}
                  />
                )}
                {/* 수치 (바 바로 옆) */}
                <span
                  className={`text-[11px] font-medium whitespace-nowrap shrink-0 px-1.5 ${val > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}
                >
                  {formatted}
                </span>
                {/* 나머지 여백 */}
                <div style={{ flex: `${val > 0 ? 100 - Math.max(pct, 3) : 1} 1 0px` }} />
                {/* 목표선 */}
                {targetPct !== null && (
                  <div
                    className="absolute top-0 h-full w-0.5 bg-foreground/30"
                    style={{ left: `${Math.min(targetPct, 100)}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
        {/* 목표선 범례 */}
        {targetPct !== null && dailyTarget > 0 && (
          <div className="flex items-center gap-1.5 pt-1.5">
            <div className="w-3 h-0.5 bg-foreground/30" />
            <span className="text-[10px] text-muted-foreground">
              일일 목표 {dailyTarget.toLocaleString()}{metricOption.unit}
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
  prevMeal,
  dailyStats,
}: {
  meal: MealMetrics;
  targets: NutritionTargets;
  comparison?: { diff: number; label: string };
  prevMeal?: MealMetrics;
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
      {/* 0. 프로필 배너 */}
      {targets.hasTargets && (targets.dietType || targets.dietaryGoal) && (
        <DietProfileBanner targets={targets} />
      )}

      {/* 1. 일일 평균 칼로리 */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">일일 평균</h3>
        <CalorieSummaryCard meal={meal} targets={targets} comparison={comparison} />
      </div>

      {/* 2. 영양소 균형 (목표 있을 때) — 매크로 바 + 점수 + 인사이트 통합 */}
      {targets.hasTargets && macroTotal > 0 && (
        <NutritionBalanceSection meal={meal} targets={targets} prevMeal={prevMeal} />
      )}

      {/* 3a. 일별 기록 (주간) — 메트릭 필터로 칼로리/단백질/탄수/지방 전환 */}
      {dailyStats && (
        <DailyNutritionLog
          dailyStats={dailyStats}
          dailyTargets={targets.hasTargets ? targets.daily : undefined}
        />
      )}

      {/* 3b. 3대 영양소 비율 (목표 없을 때 폴백) */}
      {!targets.hasTargets && macros.length >= 2 && (
        <DonutChart macros={macros} />
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

  // 비교: 일 평균 칼로리 변화율
  const comparison = (() => {
    if (!prevStats) return undefined;
    const prevAvg = prevStats.meal.avgCalories;
    if (prevAvg === 0) return undefined;
    const diff = Math.round(((stats.meal.avgCalories - prevAvg) / prevAvg) * 100);
    return { diff, label: '지난주' };
  })();

  const prevMeal = prevStats && prevStats.meal.totalCalories > 0
    ? prevStats.meal
    : undefined;

  return (
    <NutritionMetrics
      meal={stats.meal}
      targets={targets}
      comparison={comparison}
      prevMeal={prevMeal}
      dailyStats={stats.dailyStats}
    />
  );
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

  // 비교: 일 평균 칼로리 변화율
  const comparison = (() => {
    if (!prevStats) return undefined;
    const prevAvg = prevStats.meal.avgCalories;
    if (prevAvg === 0) return undefined;
    const diff = Math.round(((stats.meal.avgCalories - prevAvg) / prevAvg) * 100);
    return { diff, label: '지난달' };
  })();

  const prevMeal = prevStats && prevStats.meal.totalCalories > 0
    ? prevStats.meal
    : undefined;

  return (
    <NutritionMetrics
      meal={stats.meal}
      targets={targets}
      comparison={comparison}
      prevMeal={prevMeal}
    />
  );
}
