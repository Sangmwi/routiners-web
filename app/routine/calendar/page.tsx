'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const CalendarContent = dynamic(
  () => import('@/components/routine/calendar/CalendarContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

/**
 * 전체 캘린더 페이지
 *
 * - DetailLayout + Header: 즉시 렌더링
 * - dynamic: 번들 로딩 단계
 * - QueryErrorBoundary: 에러 처리
 * - Suspense: 데이터 로딩 처리
 */
export default function RoutineCalendarPage() {
  return (
    <DetailLayout title="전체 캘린더">
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <CalendarContent />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
