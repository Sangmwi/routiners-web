'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/common/EmptyState';
import { EMPTY_STATE } from '@/lib/config/theme';
import { MetricItem } from '@/components/inbody/MetricItem';
import MiniSparkline from '@/components/ui/MiniSparkline';
import { getTrendColor } from '@/components/ui/ChangeIndicator';
import { formatTimeAgo } from '@/lib/utils/dateHelpers';
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
          <>
            {/* 헤더: 점수 | 최근 측정 */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">
                {score != null
                  ? <>점수 <span className="font-medium text-foreground">{score}점</span></>
                  : <span className="text-hint">점수 없음</span>
                }
              </p>
              {measuredAt && (
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(measuredAt)}
                </p>
              )}
            </div>
            <div className="border-t border-edge-faint mb-3" />

            {/* 메트릭 그리드 */}
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
          </>
        )}
      </div>
    </section>
  );
}
