'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import { MetricItem } from '@/components/inbody/MetricItem';
import MiniSparkline from '@/components/ui/MiniSparkline';
import { getTrendColor } from '@/components/ui/ChangeIndicator';
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
 * SectionHeader + 3열 MetricItem + 미니 스파크라인
 */
export default function InBodySection({ summary, history }: InBodySectionProps) {
  const hasData = !!summary.latest;
  const hasHistory = history.length >= 2;
  const chronological = hasHistory ? [...history].reverse() : [];

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
          <div className="grid grid-cols-3 gap-2">
            {INBODY_METRICS.map(({ key, label, unit, positiveIsGood }) => {
              const sparkData = hasHistory ? chronological.map((r) => r[key]) : [];
              const change = summary.changes?.[key];
              return (
                <MetricItem
                  key={key}
                  label={label}
                  value={summary.latest?.[key]}
                  unit={unit}
                >
                  {hasHistory && (
                    <div className="mt-6">
                      <MiniSparkline
                        data={sparkData}
                        height={28}
                        showEndDot
                        showAllDots={false}
                        gradientFill={false}
                        color={getTrendColor(change, positiveIsGood)}
                        lineOpacity={0.7}
                      />
                    </div>
                  )}
                </MetricItem>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
