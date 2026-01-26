'use client';

import { Suspense } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { WeeklyStatsSummary, WeeklyProgressChart } from '@/components/routine';
import { useWeeklyStatsSuspense } from '@/hooks/routine';
import { PulseLoader } from '@/components/ui/PulseLoader';

// ============================================================
// Content Component (Suspense 내부)
// ============================================================

function StatsContent() {
  // Suspense 버전 - data 항상 존재
  const stats = useWeeklyStatsSuspense();

  // 데이터 없음 (예정된 루틴 없음)
  if (!stats || (stats.workout.scheduled === 0 && stats.meal.scheduled === 0)) {
    return (
      <>
        <PageHeader title="주간 통계" />
        <div className="p-4">
          <p className="text-muted-foreground text-center">
            이번 주 예정된 루틴이 없습니다.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="주간 통계" />

      <div className="p-4 space-y-6">
        {/* 주간 기간 표시 */}
        <p className="text-sm text-muted-foreground text-center">
          {stats.weekLabel}
        </p>

        {/* 운동/식단 달성률 */}
        <WeeklyStatsSummary stats={stats} />

        {/* 일별 현황 차트 */}
        <WeeklyProgressChart stats={stats} />
      </div>
    </>
  );
}

// ============================================================
// Loading Fallback
// ============================================================

function LoadingFallback() {
  return (
    <>
      <PageHeader title="주간 통계" />
      <PulseLoader />
    </>
  );
}

// ============================================================
// Main Export
// ============================================================

export default function StatsClient() {
  return (
    <div className="min-h-screen bg-background pb-8">
      <QueryErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <StatsContent />
        </Suspense>
      </QueryErrorBoundary>
    </div>
  );
}
