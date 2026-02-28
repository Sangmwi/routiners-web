'use client';

import { Suspense, useState } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import SegmentedControl from '@/components/ui/SegmentedControl';
import ChangeIndicator from '@/components/ui/ChangeIndicator';
import { PulseLoader } from '@/components/ui/PulseLoader';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import Big3CreateSheet from '@/components/big3/Big3CreateSheet';
import Big3RecordSection from '@/components/profile/big3/Big3RecordSection';
import { BIG3_LIFT_CONFIG } from '@/lib/constants/big3';
import { useBig3SummarySuspense } from '@/hooks/big3';
import type { Big3LiftType } from '@/lib/types/big3';

// ============================================================
// Constants
// ============================================================

const FILTER_OPTIONS = [
  { key: 'all' as const, label: '전체' },
  ...BIG3_LIFT_CONFIG.map(({ key, label }) => ({ key, label })),
];

const LIFT_LABEL_MAP = Object.fromEntries(
  BIG3_LIFT_CONFIG.map(({ key, label }) => [key, label]),
) as Record<Big3LiftType, string>;

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

// ============================================================
// Main Content Component
// ============================================================

export default function Big3Content() {
  const { data: summary } = useBig3SummarySuspense();
  const [selectedLiftType, setSelectedLiftType] = useState<Big3LiftType | undefined>(undefined);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filterValue = selectedLiftType ?? 'all';
  const handleFilterChange = (value: string) => {
    setSelectedLiftType(value === 'all' ? undefined : (value as Big3LiftType));
  };

  // 합산 PR 계산
  const prTotal = summary.lifts.reduce((sum, l) => sum + (l.allTimePr ?? 0), 0);
  const latestPrDate = summary.lifts
    .map((l) => l.allTimePrDate)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <>
      <div className="pb-footer-clearance -mx-(--layout-padding-x)">
        <div className="divide-y divide-edge-divider">
          {/* 히어로: 좌측 합계 + 우측 종목별 */}
          <div className="px-(--layout-padding-x) pt-4 pb-8">
            <div className="flex gap-8">
              {/* 좌측: 합계 + 메타 */}
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">3대 합계</p>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-4xl font-bold tabular-nums text-foreground">
                    {summary.latestTotal}
                  </span>
                  <span className="text-base text-muted-foreground">kg</span>
                  {summary.totalChange !== 0 && (
                    <ChangeIndicator value={summary.totalChange} positiveIsGood unit="kg" showIcon />
                  )}
                </div>
                {prTotal > 0 && latestPrDate && (
                  <p className="text-xs text-hint-strong mt-2.5">
                    최고 {prTotal}kg · {formatShortDate(latestPrDate)} 달성
                  </p>
                )}
              </div>

              {/* 우측: 종목별 3행 */}
              <div className="shrink-0 divide-y divide-edge-faint">
                {summary.lifts.map((lift) => (
                  <div key={lift.liftType} className="flex items-center justify-between gap-6 p-3.5 min-w-40">
                    <span className="text-sm text-muted-foreground">
                      {LIFT_LABEL_MAP[lift.liftType]}
                    </span>
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {lift.latest != null ? (
                        <>
                          {lift.latest}
                          <span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
                        </>
                      ) : (
                        <span className="text-hint">-</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 기록 헤더: 인라인 */}
          <div className="flex items-center justify-between px-(--layout-padding-x) pt-5 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-card-foreground">기록</h3>
            </div>
            <SegmentedControl
              options={FILTER_OPTIONS}
              value={filterValue}
              onChange={handleFilterChange}
              size="sm"
            />
          </div>

          {/* 기록 리스트 — 필터 변경 시 이 영역만 Suspense */}
          <QueryErrorBoundary>
            <Suspense fallback={<PulseLoader className="px-(--layout-padding-x) pt-5 pb-4" />}>
              <Big3RecordSection selectedLiftType={selectedLiftType} />
            </Suspense>
          </QueryErrorBoundary>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <GradientFooter variant="page" wrapperClassName="animate-float-up">
        <Button
          size="lg"
          onClick={() => setIsCreateOpen(true)}
          className="w-full"
        >
          <PlusIcon size={16} className="mr-2" />
          새 기록 추가
        </Button>
      </GradientFooter>

      {/* Create Drawer */}
      <Big3CreateSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultLiftType={selectedLiftType}
      />
    </>
  );
}
