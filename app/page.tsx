'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MainTabLayout, MainTabHeader } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const HomeContent = dynamic(
  () => import('@/components/home/HomeContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

/**
 * 홈 페이지
 *
 * - Layout + Header: 즉시 렌더링 (Suspense 밖)
 * - 단일 Suspense: 번들 + 데이터 로딩 모두 처리
 * - 깜빡임 없는 로딩 UX
 */
export default function HomePage() {
  return (
    <MainTabLayout>
      <MainTabHeader title="홈" />
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <HomeContent />
        </Suspense>
      </QueryErrorBoundary>
    </MainTabLayout>
  );
}
