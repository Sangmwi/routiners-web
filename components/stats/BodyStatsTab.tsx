'use client';

import { Suspense } from 'react';
import AppLink from '@/components/common/AppLink';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import EmptyState from '@/components/common/EmptyState';
import ChangeIndicator, { getTrendColor } from '@/components/ui/ChangeIndicator';
import MiniSparkline from '@/components/ui/MiniSparkline';
import { PulseLoader } from '@/components/ui/PulseLoader';
import { CaretRightIcon } from '@phosphor-icons/react';
import { EMPTY_STATE } from '@/lib/config/theme';
import { useInBodyRecordsSuspense } from '@/hooks/inbody/queries';
import { INBODY_METRICS } from '@/lib/constants/inbody';
import type { InBodyRecord } from '@/lib/types';

/** "2024-03-15" → "24.3.15" (연도 포함 간결 포맷) */
function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${String(d.getFullYear()).slice(2)}.${d.getMonth() + 1}.${d.getDate()}`;
}

/** 첫/마지막 기록 사이 변화량 계산 */
function computeChanges(chronological: InBodyRecord[]) {
  if (chronological.length < 2) return undefined;
  const first = chronological[0];
  const last = chronological[chronological.length - 1];
  const periodDays = Math.round(
    (new Date(last.measuredAt).getTime() - new Date(first.measuredAt).getTime()) /
    (1000 * 60 * 60 * 24),
  );
  return {
    weight: Number((last.weight - first.weight).toFixed(2)),
    skeletalMuscleMass:
      last.skeletalMuscleMass != null && first.skeletalMuscleMass != null
        ? Number((last.skeletalMuscleMass - first.skeletalMuscleMass).toFixed(2))
        : 0,
    bodyFatPercentage:
      last.bodyFatPercentage != null && first.bodyFatPercentage != null
        ? Number((last.bodyFatPercentage - first.bodyFatPercentage).toFixed(1))
        : 0,
    periodDays,
  };
}

// ============================================================================
// MetricCards — Suspense 내부에서 데이터 fetch
// ============================================================================

function MetricCards({ limit }: { limit: number }) {
  const { data: records } = useInBodyRecordsSuspense(limit, 0);

  // API는 newest-first로 반환하므로 시간순 정렬
  const chronological = [...records].sort((a, b) =>
    a.measuredAt.localeCompare(b.measuredAt),
  );
  const hasData = chronological.length > 0;
  const hasHistory = chronological.length >= 2;
  const latest = hasData ? chronological[chronological.length - 1] : undefined;
  const changes = computeChanges(chronological);

  const pointLabels = chronological.map((r) => formatFullDate(r.measuredAt));
  const dateRange: [string, string] | undefined = hasHistory
    ? [
      formatFullDate(chronological[0].measuredAt),
      formatFullDate(chronological[chronological.length - 1].measuredAt),
    ]
    : undefined;

  // 10개 이하: 모든 점 표시, 초과: 선만 (interactive로 터치 확인)
  const showDots = chronological.length <= 10;

  if (!hasData) {
    return (
      <EmptyState
        {...EMPTY_STATE.inbody.noRecord}
        action={{ label: '등록하기', href: '/profile/inbody' }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {INBODY_METRICS.map(({ key, label, unit, positiveIsGood }) => {
        const value = latest?.[key];
        const change = changes?.[key];
        const sparkData = chronological.map((r) => r[key]).filter((v): v is number => v != null);
        const fmt = (v: number) => v.toFixed(1);

        return (
          <div key={key} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              {change != null && change !== 0 && changes?.periodDays != null && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-hint">
                    {chronological.length}회 측정
                  </span>
                  <ChangeIndicator value={change} positiveIsGood={positiveIsGood} unit={unit} showIcon />
                </div>
              )}
            </div>
            <p className="text-xl font-bold text-foreground mb-1">
              {value != null ? (
                <>
                  {value}
                  <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
                </>
              ) : (
                <span className="text-hint">-</span>
              )}
            </p>
            {hasHistory && (
              <MiniSparkline
                data={sparkData}
                height={120}
                showAllDots={showDots}
                showEndDot={false}
                showYAxis
                lineOpacity={0.5}
                dateRange={dateRange}
                color={getTrendColor(change, positiveIsGood)}
                interactive
                pointLabels={pointLabels}
                unit={unit}
                formatValue={fmt}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// InBody 메트릭 스켈레톤
// ============================================================================

function MetricCardsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4">
          <div
            className="pulse-bar rounded-lg mb-3"
            style={{ width: '20%', height: 16, animationDelay: `${i * 120}ms` }}
          />
          <div
            className="pulse-bar rounded-lg mb-3"
            style={{ width: '35%', height: 28, animationDelay: `${i * 120 + 60}ms` }}
          />
          <div
            className="pulse-bar rounded-2xl"
            style={{ width: '100%', height: 120, animationDelay: `${i * 120 + 120}ms` }}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// BodyStatsTab — 헤더는 Suspense 밖, 메트릭만 Suspense 안
// ============================================================================

interface BodyStatsTabProps {
  limit: number;
}

/**
 * 신체 탭 콘텐츠
 *
 * - 인바디 3대 메트릭 (체중/골격근량/체지방률)
 * - 스파크라인으로 추이 표시
 * - 개수 선택은 상위 StatsPageContent에서 DomainTabs rightSlot으로 제어
 * - 인바디 관리 페이지 링크
 */
export default function BodyStatsTab({ limit }: BodyStatsTabProps) {
  return (
    <>
      {/* 헤더: 타이틀 + 관리 링크 — Suspense 밖 */}
      <div className="flex items-center justify-between my-4">
        <h3 className="text-base font-medium text-foreground px-2">인바디 추이</h3>
        <AppLink
          href="/profile/inbody"
          className="text-xs font-medium text-primary flex items-center gap-0.5 px-2"
        >
          관리
          <CaretRightIcon size={12} weight="bold" />
        </AppLink>
      </div>

      {/* 메트릭 카드 — Suspense 경계 */}
      <QueryErrorBoundary>
        <Suspense fallback={<MetricCardsSkeleton />}>
          <MetricCards limit={limit} />
        </Suspense>
      </QueryErrorBoundary>
    </>
  );
}
