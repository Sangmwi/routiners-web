'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import ChangeIndicator from '@/components/ui/ChangeIndicator';
import MiniSparkline from '@/components/ui/MiniSparkline';
import type { Big3Summary } from '@/lib/types/progress';
import { Barbell } from '@phosphor-icons/react';

interface Big3LiftCardProps {
  summary: Big3Summary;
}

const LIFT_CONFIG = [
  { key: 'squat', label: '스쿼트' },
  { key: 'bench', label: '벤치프레스' },
  { key: 'deadlift', label: '데드리프트' },
] as const;

export default function Big3LiftCard({ summary }: Big3LiftCardProps) {
  const hasData = !!summary.latest;
  const hasHistory = summary.history.length >= 2;

  // 빈 상태
  if (!hasData) {
    return (
      <section>
        <SectionHeader
          title="3대 운동"
          action={{ label: '루틴 만들기', href: '/routine/coach' }}
        />
        <div className="bg-muted/20 rounded-2xl p-6 mt-3 flex flex-col items-center gap-2">
          <Barbell className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">아직 3대 운동 기록이 없어요</p>
          <p className="text-[11px] text-muted-foreground/60">
            스쿼트, 벤치프레스, 데드리프트를 기록해보세요
          </p>
        </div>
      </section>
    );
  }

  const { latest, changes } = summary;
  const sparklineData = summary.history.map((p) => p.total);

  return (
    <section>
      <SectionHeader
        title="3대 운동"
        action={{ label: '기록 보기', href: '/routine/stats' }}
      />

      <div className="bg-muted/20 rounded-2xl p-4 mt-3">
        {/* 합계 */}
        <div className="mb-4">
          <p className="text-[11px] text-muted-foreground mb-1">3대 합계</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">
              {latest!.total}
            </span>
            <span className="text-xs font-normal text-muted-foreground">kg</span>
            {changes && changes.total !== 0 && (
              <ChangeIndicator value={changes.total} positiveIsGood />
            )}
          </div>
        </div>

        {/* 종목별 3열 그리드 */}
        <div className="grid grid-cols-3 gap-3">
          {LIFT_CONFIG.map(({ key, label }) => {
            const value = latest![key];
            const change = changes?.[key];

            return (
              <div key={key} className="text-center">
                <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                <p className="text-base font-bold text-foreground">
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

        {/* 스파크라인 */}
        {hasHistory && (
          <div className="mt-4">
            <MiniSparkline data={sparklineData} height={48} />
          </div>
        )}
      </div>
    </section>
  );
}
