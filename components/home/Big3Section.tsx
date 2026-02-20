'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import ChangeIndicator from '@/components/ui/ChangeIndicator';
import MiniSparkline from '@/components/ui/MiniSparkline';
import { BarbellIcon } from '@phosphor-icons/react';
import type { Big3Summary } from '@/lib/types/progress';

interface Big3SectionProps {
  summary: Big3Summary;
}

const LIFT_CONFIG = [
  { key: 'squat', label: '스쿼트' },
  { key: 'bench', label: '벤치프레스' },
  { key: 'deadlift', label: '데드리프트' },
] as const;

/**
 * 홈 화면 3대 운동 독립 섹션
 *
 * SectionHeader + 합계/스파크라인 + 3열 종목별
 */
export default function Big3Section({ summary }: Big3SectionProps) {
  const hasData = !!summary.latest;
  const hasHistory = summary.history.length >= 2;

  return (
    <section>
      <SectionHeader
        title="3대 운동"
        action={{ label: '통계', href: '/routine/stats?tab=workout' }}
      />

      <div className="bg-muted/20 rounded-2xl p-4 mt-3">
        {!hasData ? (
          <div className="flex flex-col items-center gap-1.5 py-3">
            <BarbellIcon size={24} weight="duotone" className="text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">아직 3대 운동 기록이 없어요</p>
          </div>
        ) : (
          <>
            {/* 합계 + 스파크라인 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="shrink-0">
                <p className="text-[11px] text-muted-foreground mb-0.5">합계</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-foreground">{summary.latest!.total}</span>
                  <span className="text-xs text-muted-foreground">kg</span>
                  {summary.changes && summary.changes.total !== 0 && (
                    <ChangeIndicator value={summary.changes.total} positiveIsGood />
                  )}
                </div>
              </div>
              {hasHistory && (
                <div className="flex-1 min-w-0">
                  <MiniSparkline data={summary.history.map((p) => p.total)} height={36} />
                </div>
              )}
            </div>

            {/* 종목별 3열 */}
            <div className="grid grid-cols-3 gap-3">
              {LIFT_CONFIG.map(({ key, label }) => {
                const value = summary.latest![key];
                const change = summary.changes?.[key];

                return (
                  <div key={key} className="text-center">
                    <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-foreground">
                      {value != null ? (
                        <>
                          {value}
                          <span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </p>
                    {change != null && change !== 0 && (
                      <ChangeIndicator value={change} positiveIsGood />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
