'use client';

import ChangeIndicator, { getTrendColor } from '@/components/ui/ChangeIndicator';
import MiniSparkline from '@/components/ui/MiniSparkline';
import EmptyState from '@/components/common/EmptyState';
import { EMPTY_STATE } from '@/lib/config/theme';
import { BIG3_LIFT_CONFIG } from '@/lib/constants/big3';
import type { Big3Summary } from '@/lib/types/progress';

interface Big3SummaryCardProps {
  summary: Big3Summary;
  cardClassName?: string;
}

export function Big3SummaryCard({
  summary,
  cardClassName = 'bg-surface-secondary rounded-2xl p-4',
}: Big3SummaryCardProps) {
  if (!summary.latest) {
    return (
      <div className={cardClassName}>
        <EmptyState {...EMPTY_STATE.big3.noRecord} size="sm" />
      </div>
    );
  }

  const { latest, changes, history } = summary;
  const hasHistory = history.length >= 2;

  return (
    <div className={cardClassName}>
      {/* 헤더: 합계 */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">
          합계{' '}
          <span className="font-bold text-foreground">{latest.total}kg</span>
        </p>
        {changes && changes.total !== 0 && (
          <ChangeIndicator value={changes.total} positiveIsGood unit="kg" />
        )}
      </div>
      <div className="border-t border-edge-faint mb-3" />

      {/* 종목별 메트릭 */}
      <div className="grid grid-cols-3 gap-2">
        {BIG3_LIFT_CONFIG.map(({ key, label }) => {
          const value = latest[key];
          const change = changes?.[key];
          const sparkData = hasHistory
            ? history.map((p) => p[key]).filter((v): v is number => v != null)
            : [];

          return (
            <div key={key} className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-lg font-bold text-foreground">
                {value != null ? (
                  <>
                    {value}
                    <span className="text-xs font-normal text-muted-foreground ml-1">kg</span>
                  </>
                ) : (
                  <span className="text-hint">-</span>
                )}
              </p>
              {sparkData.length >= 2 && (
                <div className="mt-4">
                  <MiniSparkline
                    data={sparkData}
                    height={28}
                    showAllDots
                    gradientFill={false}
                    color={getTrendColor(change, true)}
                    lineOpacity={0.7}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

