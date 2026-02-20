'use client';

import AppLink from '@/components/common/AppLink';
import ChangeIndicator from '@/components/ui/ChangeIndicator';
import MiniSparkline from '@/components/ui/MiniSparkline';
import { CaretRightIcon, UserIcon } from '@phosphor-icons/react';
import { useInBodySummarySuspense, useInBodyRecordsSuspense } from '@/hooks/inbody/queries';

const METRICS_CONFIG = [
  { key: 'weight', label: '체중', unit: 'kg', positiveIsGood: false },
  { key: 'skeletalMuscleMass', label: '골격근량', unit: 'kg', positiveIsGood: true },
  { key: 'bodyFatPercentage', label: '체지방률', unit: '%', positiveIsGood: false },
] as const;

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

  if (!hasData) {
    return (
      <div className="mt-6">
        <div className="rounded-2xl bg-muted/20 p-6 text-center">
          <UserIcon size={28} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-1">인바디 기록이 없어요</p>
          <p className="text-[11px] text-muted-foreground/60 mb-3">
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
    <div className="mt-6 space-y-6">
      {/* 인바디 관리 링크 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">인바디</h3>
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
          const sparkData = hasHistory ? history.map((r) => r[key]) : [];

          return (
            <div key={key} className="bg-muted/20 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                {change != null && change !== 0 && (
                  <ChangeIndicator value={change} positiveIsGood={positiveIsGood} />
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
                <MiniSparkline data={sparkData} height={48} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
