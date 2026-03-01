'use client';

import { useState } from 'react';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@phosphor-icons/react';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { formatDate } from '@/lib/utils/dateHelpers';
import { getDisplayStatus } from '@/lib/config/theme';
import type { WeeklyStats } from '@/hooks/routine';

// ─── Types & Constants ──────────────────────────────────────────────────

type DailyMetric = 'calories' | 'protein' | 'carbs' | 'fat';

const DAILY_METRIC_OPTIONS: {
  key: DailyMetric;
  label: string;
  unit: string;
  barColor: string;
  barColorMuted: string;
}[] = [
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

// ─── Component ──────────────────────────────────────────────────────────

interface NutritionDailyLogProps {
  dailyStats: WeeklyStats['dailyStats'];
  dailyTargets?: { calories: number; protein: number; carbs: number; fat: number };
}

/**
 * 주간 일별 영양 섭취 바 차트 + 상태 아이콘.
 * 메트릭 토글(칼로리/단백질/탄수화물/지방)로 전환 가능.
 */
export default function NutritionDailyLog({ dailyStats, dailyTargets }: NutritionDailyLogProps) {
  const [metric, setMetric] = useState<DailyMetric>('calories');
  const today = formatDate(new Date());

  const metricOption = DAILY_METRIC_OPTIONS.find((o) => o.key === metric)!;
  const dailyTarget = dailyTargets?.[metric] ?? 0;

  const values = dailyStats.map((d) => getDailyValue(d, metric)).filter((v) => v > 0);
  const maxVal = Math.max(values.length > 0 ? Math.max(...values) : 0, dailyTarget);

  if (maxVal === 0) return null;

  const targetPct = dailyTarget > 0 && maxVal > 0 ? (dailyTarget / maxVal) * 100 : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-foreground">섭취 기록</h3>
        <SegmentedControl
          options={DAILY_METRIC_OPTIONS}
          value={metric}
          onChange={setMetric}
        />
      </div>
      <div className="rounded-2xl py-4 px-2 space-y-2.5">
        {dailyStats.map((day) => {
          const isToday = day.date === today;
          const val = getDailyValue(day, metric);
          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;

          const formatted = val > 0
            ? metric === 'calories' ? `${val.toLocaleString()}kcal` : `${val}g`
            : '';

          const displayStatus = day.meal ? getDisplayStatus(day.meal, day.date) : null;
          const barColorClass = displayStatus === 'completed'
            ? metricOption.barColor
            : metricOption.barColorMuted;

          return (
            <div key={day.date} className="flex items-center gap-1.5">
              {/* 요일 */}
              <span className={`text-xs font-semibold w-6 shrink-0 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {day.dayOfWeek}
              </span>
              {/* 바 + 수치 + 상태 아이콘 */}
              <div className={`flex-1 min-w-0 h-5 rounded-md relative flex items-center overflow-hidden ${val > 0 ? '' : 'bg-surface-hover'}`}>
                {val > 0 && (
                  <div
                    className={`h-full rounded-md transition-all duration-300 ${barColorClass}`}
                    style={{ flex: `${Math.max(pct, 3)} 1 0px` }}
                  />
                )}
                <span className={`inline-flex items-center gap-0.5 whitespace-nowrap shrink-0 px-1.5 text-xs font-medium ${val > 0 ? 'text-foreground' : 'text-hint-faint'}`}>
                  {formatted}
                  {displayStatus === 'completed' && (
                    <CheckCircleIcon size={13} weight="fill" className="text-primary" />
                  )}
                  {displayStatus === 'scheduled' && (
                    <ClockIcon size={13} weight="duotone" className="text-scheduled" />
                  )}
                  {displayStatus === 'incomplete' && (
                    <XCircleIcon size={13} weight="fill" className="text-hint-faint" />
                  )}
                </span>
                <div style={{ flex: `${val > 0 ? 100 - Math.max(pct, 3) : 1} 1 0px` }} />
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
            <span className="text-xs text-muted-foreground">
              일일 목표 {dailyTarget.toLocaleString()}{metricOption.unit}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
