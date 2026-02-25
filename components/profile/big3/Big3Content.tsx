'use client';

import { useState } from 'react';
import { PlusIcon, TrophyIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import SectionHeader from '@/components/ui/SectionHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import ChangeIndicator from '@/components/ui/ChangeIndicator';
import Big3RecordList from '@/components/big3/Big3RecordList';
import Big3DetailModal from '@/components/big3/Big3DetailModal';
import Big3CreateDrawer from '@/components/big3/Big3CreateDrawer';
import { BIG3_LIFT_CONFIG } from '@/lib/constants/big3';
import { useBig3ManagerSuspense } from '@/hooks/big3';
import type { Big3LiftType, Big3LiftSummary } from '@/lib/types/big3';

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

// ============================================================
// Main Content Component
// ============================================================

/**
 * 3대운동 관리 콘텐츠 (Suspense 내부)
 *
 * - useBig3ManagerSuspense로 데이터 + 상태 관리
 * - 상위 page.tsx의 DetailLayout에서 Header + Suspense 처리
 */
export default function Big3Content() {
  const {
    records,
    summary,
    selectedLiftType,
    setSelectedLiftType,
    selectedRecord,
    isDetailModalOpen,
    openDetailModal,
    closeDetailModal,
  } = useBig3ManagerSuspense();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // 필터값 (SegmentedControl용)
  const filterValue = selectedLiftType ?? 'all';
  const handleFilterChange = (value: string) => {
    setSelectedLiftType(value === 'all' ? undefined : (value as Big3LiftType));
  };

  return (
    <>
      <div className="pb-footer-clearance -mx-(--layout-padding-x)">
        <div className="divide-y divide-edge-divider">
          {/* 요약 섹션 */}
          <div className="px-(--layout-padding-x) pt-1 pb-5">
            <SectionHeader title="종목별 요약" size="md" className="mb-4" />
            <div className="grid grid-cols-3 gap-3">
              {summary.lifts.map((lift) => (
                <LiftSummaryCard key={lift.liftType} lift={lift} />
              ))}
            </div>

            {/* 합계 */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground">3대 합계</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tabular-nums text-foreground">
                  {summary.latestTotal}
                  <span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
                </span>
                {summary.totalChange !== 0 && (
                  <ChangeIndicator
                    value={summary.totalChange}
                    positiveIsGood
                    unit="kg"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 필터 + 기록 헤더 */}
          <div className="px-(--layout-padding-x) pt-5 pb-3">
            <SectionHeader
              title="기록"
              size="md"
              badge={records.length}
              className="mb-3"
            />
            <SegmentedControl
              options={FILTER_OPTIONS}
              value={filterValue}
              onChange={handleFilterChange}
              size="md"
            />
          </div>

          {/* 기록 리스트 */}
          <Big3RecordList
            records={records}
            onRecordClick={openDetailModal}
          />
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <GradientFooter variant="page">
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="w-full"
        >
          <PlusIcon size={16} className="mr-2" />
          새 기록 추가
        </Button>
      </GradientFooter>

      {/* Create Drawer */}
      <Big3CreateDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultLiftType={selectedLiftType}
      />

      {/* Detail Modal */}
      {selectedRecord && (
        <Big3DetailModal
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          record={selectedRecord}
        />
      )}
    </>
  );
}

// ============================================================
// Lift Summary Card
// ============================================================

function LiftSummaryCard({ lift }: { lift: Big3LiftSummary }) {
  return (
    <div className="rounded-xl bg-surface-secondary p-3.5">
      <span className="text-[10px] font-medium text-muted-foreground">
        {LIFT_LABEL_MAP[lift.liftType]}
      </span>
      <div className="mt-1.5">
        {lift.latest != null ? (
          <>
            <span className="text-lg font-bold tabular-nums text-foreground leading-none">
              {lift.latest}
            </span>
            <span className="text-[10px] text-muted-foreground ml-0.5">kg</span>
          </>
        ) : (
          <span className="text-sm text-hint">-</span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-1">
        {lift.change !== 0 && (
          <ChangeIndicator value={lift.change} positiveIsGood unit="kg" />
        )}
      </div>
      {lift.allTimePr != null && lift.allTimePr > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-hint-strong">
          <TrophyIcon size={12} className="text-amber-500" />
          <span className="tabular-nums">{lift.allTimePr}kg</span>
        </div>
      )}
    </div>
  );
}
