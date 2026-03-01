'use client';

import { useState } from 'react';
import { BowlFoodIcon, FireIcon } from '@phosphor-icons/react';
import EmptyState from '@/components/common/EmptyState';
import { EMPTY_STATE, MACRO_COLORS } from '@/lib/config/theme';
import ComparisonBadge from '@/components/ui/ComparisonBadge';
import ProgressRateBar from '@/components/ui/ProgressRateBar';
import SegmentedControl from '@/components/ui/SegmentedControl';
import {
  useMonthlyStatsSuspense,
  useWeeklyStatsSuspense,
} from '@/hooks/routine';
import type { WeeklyStats } from '@/hooks/routine';
import { useDietaryProfileSuspense } from '@/hooks/dietaryProfile';
import { addDays, formatDate } from '@/lib/utils/dateHelpers';
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
import type { UseStatsPeriodNavigatorReturn } from '@/hooks/routine/useStatsPeriodNavigator';
import StatsTabShell from './StatsTabShell';
import NutritionDonutChart from './NutritionDonutChart';
import NutritionDailyLog from './NutritionDailyLog';


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

export default function NutritionStatsTab({ navigator }: { navigator: UseStatsPeriodNavigatorReturn }) {
  return (
    <StatsTabShell
      navigator={navigator}
      weeklyContent={(dateStr) => <WeeklyNutrition dateStr={dateStr} />}
      monthlyContent={(year, month) => <MonthlyNutrition year={year} month={month} />}
    />
  );
}

// ─── Diet Profile Banner ────────────────────────────────────────────────

function DietProfileBanner({ targets }: { targets: NutritionTargets }) {
  const ratio = targets.dietType
    ? (MACRO_RATIOS[targets.dietType] ?? DEFAULT_MACRO_RATIO)
    : DEFAULT_MACRO_RATIO;

  return (
    <div className="bg-surface-accent border-l-2 border-primary rounded-r-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        {targets.dietType && (
          <span className="text-xs font-medium bg-surface-accent text-primary px-2 py-0.5 rounded-full">
            {DIET_TYPE_LABELS[targets.dietType]}
          </span>
        )}
        {targets.dietaryGoal && (
          <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
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

// ─── Nutrition Summary Section (2x2 grid + 총합/평균 토글) ──────────────

type SummaryMode = 'total' | 'average';

const SUMMARY_MODE_OPTIONS = [
  { key: 'total' as const, label: '총합' },
  { key: 'average' as const, label: '평균' },
];

function NutritionSummarySection({
  meal,
  targets,
  comparison,
}: {
  meal: MealMetrics;
  targets: NutritionTargets;
  comparison?: { diff: number; label: string };
}) {
  const [mode, setMode] = useState<SummaryMode>('total');

  const isPlannedOnly = meal.completed === 0;
  const completed = meal.completed || 1;

  const metrics = [
    {
      icon: <FireIcon size={18} weight={isPlannedOnly ? 'duotone' : 'fill'} className={isPlannedOnly ? 'text-muted-foreground' : 'text-orange-400'} />,
      label: mode === 'total' ? '칼로리' : '평균 칼로리',
      total: isPlannedOnly ? meal.plannedCalories : meal.totalCalories,
      avg: isPlannedOnly ? meal.plannedCalories : meal.avgCalories,
      format: (v: number) => `${v.toLocaleString()}`,
      unit: 'kcal',
      targetPeriod: targets.hasTargets ? targets.period.calories : 0,
      targetDaily: targets.hasTargets ? targets.daily.calories : 0,
      dotColor: null as string | null,
      comparison,
    },
    {
      icon: null,
      label: mode === 'total' ? '단백질' : '평균 단백질',
      total: isPlannedOnly ? meal.plannedProtein : meal.totalProtein,
      avg: Math.round((isPlannedOnly ? meal.plannedProtein : meal.totalProtein) / completed),
      format: (v: number) => `${v.toLocaleString()}`,
      unit: 'g',
      targetPeriod: targets.hasTargets ? targets.period.protein : 0,
      targetDaily: targets.hasTargets ? targets.daily.protein : 0,
      dotColor: 'bg-sky-400',
    },
    {
      icon: null,
      label: mode === 'total' ? '탄수화물' : '평균 탄수화물',
      total: isPlannedOnly ? 0 : meal.totalCarbs,
      avg: Math.round((isPlannedOnly ? 0 : meal.totalCarbs) / completed),
      format: (v: number) => `${v.toLocaleString()}`,
      unit: 'g',
      targetPeriod: targets.hasTargets ? targets.period.carbs : 0,
      targetDaily: targets.hasTargets ? targets.daily.carbs : 0,
      dotColor: 'bg-amber-400',
    },
    {
      icon: null,
      label: mode === 'total' ? '지방' : '평균 지방',
      total: isPlannedOnly ? 0 : meal.totalFat,
      avg: Math.round((isPlannedOnly ? 0 : meal.totalFat) / completed),
      format: (v: number) => `${v.toLocaleString()}`,
      unit: 'g',
      targetPeriod: targets.hasTargets ? targets.period.fat : 0,
      targetDaily: targets.hasTargets ? targets.daily.fat : 0,
      dotColor: 'bg-rose-400',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-medium text-foreground">섭취 요약</h3>
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
        {metrics.map((m) => {
          const value = mode === 'total' ? m.total : m.avg;
          const targetVal = mode === 'total' ? m.targetPeriod : m.targetDaily;
          const percent = targetVal > 0 && value > 0 && !isPlannedOnly
            ? Math.round((value / targetVal) * 100)
            : null;

          return (
            <div key={m.label} className="bg-surface-secondary rounded-2xl p-4">
              <div className="flex items-center gap-2.5 mb-2.5">
                {m.icon ? (
                  m.icon
                ) : (
                  <div className={`w-2.5 h-2.5 rounded-full ${m.dotColor}`} />
                )}
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {value > 0 ? m.format(value) : '-'}
                {value > 0 && (
                  <span className="text-xs font-normal text-muted-foreground ml-0.5">
                    {m.unit}{mode === 'average' && '/일'}
                  </span>
                )}
              </p>
              {/* 비교 배지 (칼로리 카드만) */}
              {'comparison' in m && m.comparison && m.comparison.diff !== 0 && (
                <p className="mt-1">
                  <ComparisonBadge diff={m.comparison.diff} label={m.comparison.label} />
                </p>
              )}
              {/* 목표 프로그레스바 */}
              {percent !== null && (
                <div className="mt-2">
                  <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getAdherenceColor(percent)}`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${getAdherenceTextColor(percent)}`}>
                    {percent}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Nutrition Balance Section (매크로 바 + 점수 + 인사이트 통합) ────────

function NutritionBalanceSection({
  meal,
  targets,
}: {
  meal: MealMetrics;
  targets: NutritionTargets;
}) {
  const score = calculateBalanceScore(
    { calories: meal.totalCalories, protein: meal.totalProtein, carbs: meal.totalCarbs, fat: meal.totalFat },
    targets.period,
  );
  const { text: balanceText, colorClass } = getBalanceLabel(score);
  const insight = generateNutritionInsight(meal, targets);

  const macroData = [
    {
      label: '단백질',
      percent: targets.period.protein > 0 ? Math.round((meal.totalProtein / targets.period.protein) * 100) : 0,
      color: MACRO_COLORS['단백질'],
    },
    {
      label: '탄수화물',
      percent: targets.period.carbs > 0 ? Math.round((meal.totalCarbs / targets.period.carbs) * 100) : 0,
      color: MACRO_COLORS['탄수화물'],
    },
    {
      label: '지방',
      percent: targets.period.fat > 0 ? Math.round((meal.totalFat / targets.period.fat) * 100) : 0,
      color: MACRO_COLORS['지방'],
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-foreground">영양소 균형</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-surface-muted ${colorClass}`}>
          {balanceText} {score}점
        </span>
      </div>
      <div className="p-4 space-y-3">
        {macroData.map(({ label, percent, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${color.bg}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <span className={`text-xs font-medium ${getAdherenceTextColor(percent)}`}>
                {percent}%
              </span>
            </div>
            <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getAdherenceColor(percent)}`}
                style={{ width: `${Math.min(100, Math.max(percent, 2))}%` }}
              />
            </div>
          </div>
        ))}
        {/* 인사이트 */}
        {insight && (
          <div className="pt-3 border-t border-edge-divider">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">💡</span> {insight}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NutritionDonutChart & NutritionDailyLog are extracted to separate files ─

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
    return <EmptyState {...EMPTY_STATE.meal.noRecord} />;
  }

  // DonutChart 폴백용 매크로 데이터
  const macros: { label: keyof typeof MACRO_COLORS; value: number; pct: number }[] = [];
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
    <div className="space-y-8">
      {/* 0. 프로필 배너 */}
      {targets.hasTargets && (targets.dietType || targets.dietaryGoal) && (
        <DietProfileBanner targets={targets} />
      )}

      {/* 1. 섭취 요약 2x2 그리드 */}
      <NutritionSummarySection meal={meal} targets={targets} comparison={comparison} />

      {/* 2. 영양소 균형 (목표 있을 때) — 어드히어런스 바 + 점수 + 인사이트 */}
      {targets.hasTargets && macroTotal > 0 && (
        <NutritionBalanceSection meal={meal} targets={targets} />
      )}

      {/* 3a. 일별 기록 (주간) — 메트릭 필터로 칼로리/단백질/탄수/지방 전환 */}
      {dailyStats && (
        <NutritionDailyLog
          dailyStats={dailyStats}
          dailyTargets={targets.hasTargets ? targets.daily : undefined}
        />
      )}

      {/* 3b. 3대 영양소 비율 (목표 없을 때 폴백) */}
      {!targets.hasTargets && macros.length >= 2 && (
        <NutritionDonutChart macros={macros} />
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
    return <EmptyState {...EMPTY_STATE.meal.noRecord} />;
  }

  const targets = resolveNutritionTargets(stats.meal, profile, 7);
  const mealTotal = stats.meal.completed + stats.meal.scheduled;

  // 비교: 일 평균 칼로리 변화율
  const comparison = (() => {
    if (!prevStats) return undefined;
    const prevAvg = prevStats.meal.avgCalories;
    if (prevAvg === 0) return undefined;
    const diff = Math.round(((stats.meal.avgCalories - prevAvg) / prevAvg) * 100);
    return { diff, label: '지난주' };
  })();

  const rateComparison = prevStats && (prevStats.meal.completed + prevStats.meal.scheduled) > 0
    ? { diff: stats.meal.completionRate - prevStats.meal.completionRate, label: '지난주' }
    : undefined;

  return (
    <div className="space-y-8">
      <ProgressRateBar
        icon={BowlFoodIcon}
        label="식단"
        completionRate={stats.meal.completionRate}
        completed={stats.meal.completed}
        total={mealTotal}
        comparison={rateComparison}
      />
      <NutritionMetrics
        meal={stats.meal}
        targets={targets}
        comparison={comparison}
        dailyStats={stats.dailyStats}
      />
    </div>
  );
}

function MonthlyNutrition({ year, month }: { year: number; month: number }) {
  const stats = useMonthlyStatsSuspense(year, month);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevStats = useMonthlyStatsSuspense(prevYear, prevMonth);
  const { data: profile } = useDietaryProfileSuspense();

  if (!stats || (stats.meal.scheduled === 0 && stats.meal.completed === 0)) {
    return <EmptyState {...EMPTY_STATE.meal.noRecord} />;
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

  const mealTotal = stats.meal.completed + stats.meal.scheduled;

  const rateComparison = prevStats && (prevStats.meal.completed + prevStats.meal.scheduled) > 0
    ? { diff: stats.meal.completionRate - prevStats.meal.completionRate, label: '지난달' }
    : undefined;

  return (
    <div className="space-y-8">
      <ProgressRateBar
        icon={BowlFoodIcon}
        label="식단"
        completionRate={stats.meal.completionRate}
        completed={stats.meal.completed}
        total={mealTotal}
        comparison={rateComparison}
      />
      <NutritionMetrics
        meal={stats.meal}
        targets={targets}
        comparison={comparison}
      />
    </div>
  );
}
