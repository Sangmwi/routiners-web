'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MainTabLayout, MainTabHeader } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const StatsPageContent = dynamic(
  () => import('@/components/stats/StatsPageContent'),
  { ssr: false }
);

/**
 * 통계 페이지 (메인 탭)
 *
 * 도메인 탭 [현황/운동/식단/인바디] 구조
 * ?tab= 쿼리파라미터로 초기 탭 선택 지원
 */
export default function StatsPage() {
  return (
    <MainTabLayout>
      <MainTabHeader title="통계" />
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <StatsPageContent />
        </Suspense>
      </QueryErrorBoundary>
    </MainTabLayout>
  );
}
