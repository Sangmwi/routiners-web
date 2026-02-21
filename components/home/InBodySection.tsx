'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import ChangeIndicator from '@/components/ui/ChangeIndicator';
import MiniSparkline from '@/components/ui/MiniSparkline';
import type { InBodySummary, InBodyRecord } from '@/lib/types';

interface InBodySectionProps {
  summary: InBodySummary;
  history: InBodyRecord[];
}

const INBODY_METRICS = [
  { key: 'weight', label: '체중', unit: 'kg', positiveIsGood: false },
  { key: 'skeletalMuscleMass', label: '골격근량', unit: 'kg', positiveIsGood: true },
  { key: 'bodyFatPercentage', label: '체지방률', unit: '%', positiveIsGood: false },
] as const;

/**
 * 홈 화면 인바디 독립 섹션
 *
 * SectionHeader + 3열 메트릭 카드
 */
export default function InBodySection({ summary, history }: InBodySectionProps) {
  const hasData = !!summary.latest;
  const hasHistory = history.length >= 2;

  return (
    <section>
      <SectionHeader
        title="인바디"
        action={hasData
          ? { label: '관리', href: '/profile/inbody' }
          : { label: '등록', href: '/profile/inbody' }
        }
      />

      <div className="bg-muted/20 rounded-2xl p-4 mt-3">
        {!hasData ? (
          <div className="flex flex-col items-center gap-1.5 py-3">
            <p className="text-xs text-muted-foreground">인바디 기록이 없어요</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {INBODY_METRICS.map(({ key, label, unit, positiveIsGood }) => {
              const value = summary.latest?.[key];
              const change = summary.changes?.[key];
              const sparkData = hasHistory ? [...history].reverse().map((r) => r[key]) : [];

              return (
                <div key={key} className="text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                  <p className="text-base font-bold text-foreground">
                    {value != null ? (
                      <>
                        {value}
                        <span className="text-xs font-normal text-muted-foreground ml-0.5">
                          {unit}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground/50">-</span>
                    )}
                  </p>
                  {change != null && change !== 0 && (
                    <ChangeIndicator value={change} positiveIsGood={positiveIsGood} />
                  )}
                  {hasHistory && (
                    <div className="mt-1">
                      <MiniSparkline data={sparkData} height={28} showAllDots />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
