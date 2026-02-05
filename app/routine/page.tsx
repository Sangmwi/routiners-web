'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MainTabLayout, MainTabHeader } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const RoutineContent = dynamic(
  () => import('@/components/routine/RoutineContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

/**
 * 루틴 페이지
 *
 * - Layout + Header: 즉시 렌더링 (Suspense 밖)
 * - 단일 Suspense: 번들 + 데이터 로딩 모두 처리
 * - 깜빡임 없는 로딩 UX
 */
export default function RoutinePage() {
  return (
    <MainTabLayout>
      <MainTabHeader title="내 루틴" />
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <RoutineContent />
        </Suspense>
      </QueryErrorBoundary>
    </MainTabLayout>
  );
}
