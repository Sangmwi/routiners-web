'use client';

import { Suspense } from 'react';
import { use } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const MealContent = dynamic(
  () => import('@/components/routine/event/MealContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

interface MealPageProps {
  params: Promise<{ date: string }>;
}

/**
 * 식단 상세 페이지
 *
 * - DetailLayout + Header: 즉시 렌더링
 * - QueryErrorBoundary: 에러 처리
 * - Suspense: 데이터 로딩 처리
 */
export default function MealPage({ params }: MealPageProps) {
  const { date } = use(params);

  return (
    <DetailLayout title="식단 관리">
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <MealContent date={date} />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
