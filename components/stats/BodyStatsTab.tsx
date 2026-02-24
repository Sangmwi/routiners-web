'use client';

import { useState } from 'react';
import AppLink from '@/components/common/AppLink';
import ChangeIndicator, { getTrendColor } from '@/components/ui/ChangeIndicator';
import MiniSparkline from '@/components/ui/MiniSparkline';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { CaretRightIcon, UserIcon } from '@phosphor-icons/react';
import { useInBodyRecordsSuspense } from '@/hooks/inbody/queries';
import type { InBodyRecord } from '@/lib/types';

type RecordCount = '5' | '10' | '20' | 'all';

const COUNT_OPTIONS = [
  { key: '5' as const, label: '5개' },
  { key: '10' as const, label: '10개' },
  { key: '20' as const, label: '20개' },
  { key: 'all' as const, label: '전체' },
];

const COUNT_TO_LIMIT: Record<RecordCount, number> = {
  '5': 5,
  '10': 10,
  '20': 20,
  all: 100,
};

const METRICS_CONFIG = [
  { key: 'weight', label: '체중', unit: 'kg', positiveIsGood: false },
  { key: 'skeletalMuscleMass', label: '골격근량', unit: 'kg', positiveIsGood: true },
  { key: 'bodyFatPercentage', label: '체지방률', unit: '%', positiveIsGood: false },
] as const;

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
    skeletalMuscleMass: Number(
      (last.skeletalMuscleMass - first.skeletalMuscleMass).toFixed(2),
    ),
    bodyFatPercentage: Number(
      (last.bodyFatPercentage - first.bodyFatPercentage).toFixed(1),
    ),
    periodDays,
  };
}

/**
 * 신체 탭 콘텐츠
 *
 * - 인바디 3대 메트릭 (체중/골격근량/체지방률)
 * - 스파크라인으로 추이 표시
 * - 개수 선택기 (5/10/20/전체)로 표시 데이터 제어
 * - 인바디 관리 페이지 링크
 */
export default function BodyStatsTab() {
  const [recordCount, setRecordCount] = useState<RecordCount>('5');
  const limit = COUNT_TO_LIMIT[recordCount];

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
      <div>
        <div className="rounded-2xl bg-surface-secondary p-6 text-center">
          <UserIcon size={28} weight="duotone" className="text-hint-faint mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-1">인바디 기록이 없어요</p>
          <p className="text-xs text-hint-strong mb-3">
            체중, 골격근량, 체지방률을 기록해보세요
          </p>
          <AppLink
            href="/profile/inbody"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary"
          >
            등록하기
            <CaretRightIcon size={12} weight="bold" />
          </AppLink>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 헤더: 타이틀 + 관리 링크 */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-foreground">인바디 추이</h3>
        <AppLink
          href="/profile/inbody"
          className="text-xs font-medium text-primary flex items-center gap-0.5"
        >
          관리
          <CaretRightIcon size={12} weight="bold" />
        </AppLink>
      </div>

      {/* 개수 선택기 */}
      <div className="flex justify-center">
        <SegmentedControl
          options={COUNT_OPTIONS}
          value={recordCount}
          onChange={setRecordCount}
          size="sm"
        />
      </div>

      {/* 메트릭 카드 */}
      <div className="space-y-4">
        {METRICS_CONFIG.map(({ key, label, unit, positiveIsGood }) => {
          const value = latest?.[key];
          const change = changes?.[key];
          const sparkData = chronological.map((r) => r[key]);
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
                    <ChangeIndicator value={change} positiveIsGood={positiveIsGood} unit={unit} />
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
    </div>
  );
}
