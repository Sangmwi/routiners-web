'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import type { InBodySummary } from '@/lib/types';

interface InBodyMiniCardProps {
  summary: InBodySummary;
}

function ChangeIndicator({ value, positiveIsGood }: { value: number; positiveIsGood: boolean }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;

  return (
    <span className={`text-[10px] font-medium ${isGood ? 'text-emerald-500' : 'text-red-400'}`}>
      {isPositive ? '+' : ''}{value.toFixed(1)}
    </span>
  );
}

const METRICS_CONFIG = [
  { key: 'weight', label: '체중', unit: 'kg', positiveIsGood: false },
  { key: 'skeletalMuscleMass', label: '골격근량', unit: 'kg', positiveIsGood: true },
  { key: 'bodyFatPercentage', label: '체지방률', unit: '%', positiveIsGood: false },
] as const;

export default function InBodyMiniCard({ summary }: InBodyMiniCardProps) {
  const hasData = !!summary.latest;

  return (
    <section>
      <SectionHeader
        title="인바디"
        action={{
          label: hasData ? '관리' : '등록',
          href: '/profile/inbody',
        }}
      />

      <div className="bg-muted/20 rounded-2xl p-4 mt-3">
        <div className="grid grid-cols-3 gap-3">
          {METRICS_CONFIG.map(({ key, label, unit, positiveIsGood }) => {
            const value = summary.latest?.[key];
            const change = summary.changes?.[key];

            return (
              <div key={key} className="text-center">
                <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                <p className="text-base font-bold text-foreground">
                  {value != null ? (
                    <>{value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span></>
                  ) : (
                    <span className="text-muted-foreground/50">-</span>
                  )}
                </p>
                {change != null && change !== 0 && (
                  <ChangeIndicator value={change} positiveIsGood={positiveIsGood} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
