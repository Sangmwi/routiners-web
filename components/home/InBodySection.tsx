'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/common/EmptyState';
import BodyCompositionSummary from '@/components/inbody/BodyCompositionSummary';
import { MetricItem } from '@/components/inbody/MetricItem';
import MiniSparkline from '@/components/ui/MiniSparkline';
import { getTrendColor } from '@/components/ui/ChangeIndicator';
import { formatTimeAgo } from '@/lib/utils/dateHelpers';
import { EMPTY_STATE } from '@/lib/config/theme';
import { INBODY_METRICS } from '@/lib/constants/inbody';
import type { InBodySummary, InBodyRecord } from '@/lib/types';

interface InBodySectionProps {
  summary: InBodySummary;
  history: InBodyRecord[];
}

/**
 * 홈 화면 인바디 독립 섹션
 *
 * SectionHeader + 3열 MetricItem + 미니 스파크라인
 */
export default function InBodySection({ summary, history }: InBodySectionProps) {
  const hasData = !!summary.latest;
  const hasHistory = history.length >= 2;
  const chronological = hasHistory ? [...history].reverse() : [];

  const score = summary.latest?.inbodyScore;
  const measuredAt = summary.latest?.measuredAt;

  return (
    <section>
      <SectionHeader
        title="인바디"
        action={hasData
          ? { label: '관리', href: '/profile/inbody' }
          : { label: '등록', href: '/profile/inbody' }
        }
      />

      <div className="bg-surface-secondary rounded-2xl p-4 mt-3">
        {!hasData ? (
          <EmptyState {...EMPTY_STATE.inbody.noRecord} size="sm" />
        ) : (
          <BodyCompositionSummary
            height={summary.latest?.height}
            measuredAt={summary.latest?.measuredAt}
            score={score}
            dateText={measuredAt ? formatTimeAgo(measuredAt) : undefined}
          >
            <div className="grid grid-cols-3 gap-2">
              {INBODY_METRICS.map(({ key, label, unit, positiveIsGood }) => {
                const sparkData = hasHistory
                  ? chronological.map((r) => r[key]).filter((v): v is number => v != null)
                  : [];
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
                          showAllDots={true}
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
          </BodyCompositionSummary>
        )}
      </div>
    </section>
  );
}
