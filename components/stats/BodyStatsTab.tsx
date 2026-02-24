'use client';

import AppLink from '@/components/common/AppLink';
import ChangeIndicator, { getTrendColor } from '@/components/ui/ChangeIndicator';
import MiniSparkline from '@/components/ui/MiniSparkline';
import { CaretRightIcon, UserIcon } from '@phosphor-icons/react';
import { useInBodySummarySuspense, useInBodyRecordsSuspense } from '@/hooks/inbody/queries';

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

/** 일수 → 자연스러운 한국어 기간 ("어제", "3일 전", "2주 전", "3개월 전", "1년 6개월 전") */
function formatPeriod(days: number): string {
  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 14) return '1주 전';
  if (days < 30) return `${Math.round(days / 7)}주 전`;

  const months = Math.round(days / 30.44);
  if (months < 12) return months === 1 ? '1개월 전' : `${months}개월 전`;

  const years = Math.floor(days / 365.25);
  const remainMonths = Math.round((days - years * 365.25) / 30.44);
  if (remainMonths <= 0) return years === 1 ? '1년 전' : `${years}년 전`;
  return `${years}년 ${remainMonths}개월 전`;
}

/**
 * 신체 탭 콘텐츠
 *
 * - 인바디 3대 메트릭 (체중/골격근량/체지방률)
 * - 스파크라인으로 추이 표시
 * - 인바디 관리 페이지 링크
 */
export default function BodyStatsTab() {
  const { data: summary } = useInBodySummarySuspense();
  const { data: history } = useInBodyRecordsSuspense(12, 0);

  const hasData = !!summary.latest;
  const hasHistory = history.length >= 2;

  // history는 최신순 → reverse로 시간순 정렬
  const chronological = hasHistory ? [...history].reverse() : [];
  const pointLabels = hasHistory ? chronological.map((r) => formatFullDate(r.measuredAt)) : [];
  const dateRange: [string, string] | undefined = hasHistory
    ? [formatFullDate(chronological[0].measuredAt), formatFullDate(chronological[chronological.length - 1].measuredAt)]
    : undefined;

  if (!hasData) {
    return (
      <div className="mt-6">
        <div className="rounded-2xl bg-surface-secondary p-6 text-center">
          <UserIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-1">인바디 기록이 없어요</p>
          <p className="text-xs text-muted-foreground/60 mb-3">
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
      {/* 인바디 관리 링크 */}
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

      {/* 메트릭 카드 */}
      <div className="space-y-4">
        {METRICS_CONFIG.map(({ key, label, unit, positiveIsGood }) => {
          const value = summary.latest?.[key];
          const change = summary.changes?.[key];
          const sparkData = chronological.map((r) => r[key]);
          const fmt = (v: number) => v.toFixed(1);

          return (
            <div key={key} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                {change != null && change !== 0 && summary.changes?.periodDays != null && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground/50">
                      {formatPeriod(summary.changes.periodDays)}보다
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
                  <span className="text-muted-foreground/50">-</span>
                )}
              </p>
              {hasHistory && (
                <MiniSparkline
                  data={sparkData}
                  height={120}
                  showAllDots={sparkData.length <= 10}
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
