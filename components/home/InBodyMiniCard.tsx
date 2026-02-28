'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import MetricCell from '@/components/ui/MetricCell';
import type { InBodySummary, InBodyRecord } from '@/lib/types';

interface InBodyMiniCardProps {
  summary: InBodySummary;
  history?: InBodyRecord[];
}

const METRICS_CONFIG = [
  { key: 'weight', label: '체중', unit: 'kg', positiveIsGood: false },
  { key: 'skeletalMuscleMass', label: '골격근량', unit: 'kg', positiveIsGood: true },
  { key: 'bodyFatPercentage', label: '체지방률', unit: '%', positiveIsGood: false },
] as const;

export default function InBodyMiniCard({ summary, history = [] }: InBodyMiniCardProps) {
  const hasData = !!summary.latest;
  const hasHistory = history.length >= 2;

  return (
    <section>
      <SectionHeader
        title="인바디"
        action={{
          label: hasData ? '관리' : '등록',
          href: '/profile/inbody',
        }}
      />

      <div className="bg-surface-secondary rounded-2xl p-4 mt-3">
        <div className="grid grid-cols-3 gap-3">
          {METRICS_CONFIG.map(({ key, label, unit, positiveIsGood }) => {
            const value = summary.latest?.[key];
            const change = summary.changes?.[key];
            const sparkData = hasHistory
              ? history.map((r) => r[key]).filter((v): v is number => v != null)
              : [];

            return (
              <MetricCell
                key={key}
                label={label}
                value={value}
                unit={unit}
                change={change}
                positiveIsGood={positiveIsGood}
                sparkData={sparkData}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
