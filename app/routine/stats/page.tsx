'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const StatsContent = dynamic(
  () => import('@/components/routine/stats/StatsContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

/**
 * 주간 통계 페이지
 *
 * - DetailLayout + Header: 즉시 렌더링
 * - QueryErrorBoundary: 에러 처리
 * - Suspense: 데이터 로딩 처리
 */
export default function WeeklyStatsPage() {
  return (
    <DetailLayout title="주간 통계" centered>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <StatsContent />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
