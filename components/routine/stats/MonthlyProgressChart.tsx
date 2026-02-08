'use client';

import { BarbellIcon, ForkKnifeIcon } from '@phosphor-icons/react';
import type { MonthlyStats } from '@/hooks/routine';

interface MonthlyProgressChartProps {
  stats: MonthlyStats;
}

/**
 * 주차별 완료율 바 차트
 *
 * 각 주차에 운동/식단 개별 바 + 개별 % 표시
 */
export default function MonthlyProgressChart({ stats }: MonthlyProgressChartProps) {
  const { weeklyBreakdown } = stats;

  if (weeklyBreakdown.length === 0) return null;

  return (
    <div className="bg-muted/20 rounded-2xl p-4">
      <h3 className="text-sm font-medium text-foreground mb-4">주차별 현황</h3>

      {/* 범례 */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BarbellIcon size={12} weight="fill" className="text-primary" />
          <span>운동</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ForkKnifeIcon size={12} weight="fill" className="text-primary/50" />
          <span>식단</span>
        </div>
      </div>

      <div className="space-y-4">
        {weeklyBreakdown.map((week) => (
          <div key={week.weekLabel} className="space-y-2">
            {/* 주차 라벨 */}
            <span className="text-xs font-medium text-muted-foreground">
              {week.weekLabel}
            </span>

            {/* 운동 바 */}
            <div className="flex items-center gap-2">
              <BarbellIcon size={12} weight="fill" className="text-primary flex-shrink-0" />
              <div className="h-2 bg-muted rounded-full overflow-hidden flex-1">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, week.workoutRate))}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground w-8 text-right">
                {week.workoutRate}%
              </span>
            </div>

            {/* 식단 바 */}
            <div className="flex items-center gap-2">
              <ForkKnifeIcon size={12} weight="fill" className="text-primary/50 flex-shrink-0" />
              <div className="h-2 bg-muted rounded-full overflow-hidden flex-1">
                <div
                  className="h-full bg-primary/50 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, week.mealRate))}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground w-8 text-right">
                {week.mealRate}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
