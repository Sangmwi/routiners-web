'use client';

import { Suspense } from 'react';
import { use } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const WorkoutContent = dynamic(
  () => import('@/components/routine/event/WorkoutContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

interface WorkoutPageProps {
  params: Promise<{ date: string }>;
}

/**
 * 운동 상세 페이지
 *
 * - DetailLayout + Header: 즉시 렌더링
 * - QueryErrorBoundary: 에러 처리
 * - Suspense: 데이터 로딩 처리
 */
export default function WorkoutPage({ params }: WorkoutPageProps) {
  const { date } = use(params);

  return (
    <DetailLayout title="운동 루틴" bottomPadding={false}>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <WorkoutContent date={date} />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
