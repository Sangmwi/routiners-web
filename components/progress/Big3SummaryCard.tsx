'use client';

import { BarbellIcon } from '@phosphor-icons/react';
import ChangeIndicator, { getTrendColor } from '@/components/ui/ChangeIndicator';
import MiniSparkline from '@/components/ui/MiniSparkline';
import { BIG3_LIFT_CONFIG } from '@/lib/constants/big3';
import type { Big3Summary } from '@/lib/types/progress';

interface Big3SummaryCardProps {
  summary: Big3Summary;
  emptyMessage?: string;
  cardClassName?: string;
  sparklineHeight?: number;
  sparklineShowMinMax?: boolean;
  sparklineShowAllDots?: boolean;
  dateRange?: [string, string];
  metricGridClassName?: string;
}

export function Big3SummaryCard({
  summary,
  emptyMessage = '3대 운동 기록이 없습니다.',
  cardClassName = 'bg-surface-secondary rounded-2xl p-4',
  sparklineHeight = 36,
  sparklineShowMinMax = false,
  sparklineShowAllDots = true,
  dateRange,
  metricGridClassName = 'grid grid-cols-3 gap-3',
}: Big3SummaryCardProps) {
  if (!summary.latest) {
    return (
      <div className="rounded-2xl bg-surface-secondary p-6 text-center">
        <BarbellIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const { latest, changes, history } = summary;
  const hasHistory = history.length >= 2;
  const sparklineData = history.map((point) => point.total);

  return (
    <div className={cardClassName}>
      <div className="flex items-center gap-3 mb-3">
        <div className="shrink-0">
          <p className="text-xs text-muted-foreground mb-0.5">합계</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">{latest.total}</span>
            <span className="text-xs text-muted-foreground">kg</span>
            {changes && changes.total !== 0 && (
              <ChangeIndicator value={changes.total} positiveIsGood unit="kg" />
            )}
          </div>
        </div>

        {hasHistory && (
          <div className="flex-1 min-w-0">
            <MiniSparkline
              data={sparklineData}
              height={sparklineHeight}
              showMinMax={sparklineShowMinMax}
              showAllDots={sparklineShowAllDots}
              dateRange={dateRange}
              color={getTrendColor(changes?.total, true)}
            />
          </div>
        )}
      </div>

      <div className={metricGridClassName}>
        {BIG3_LIFT_CONFIG.map(({ key, label }) => {
          const value = latest[key];
          const change = changes?.[key];

          return (
            <div key={key} className="text-center">
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className="text-sm font-bold text-foreground">
                {value != null ? (
                  <>
                    {value}
                    <span className="text-xs font-normal text-muted-foreground ml-1">kg</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/50">-</span>
                )}
              </p>
              {change != null && change !== 0 && (
                <ChangeIndicator value={change} positiveIsGood unit="kg" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

