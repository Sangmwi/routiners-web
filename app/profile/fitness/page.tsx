'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const FitnessContent = dynamic(
  () => import('@/components/profile/fitness/FitnessContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

/**
 * 운동 프로필 페이지
 *
 * - DetailLayout + Header: 즉시 렌더링
 * - QueryErrorBoundary: 에러 처리
 * - Suspense: 데이터 로딩 처리
 */
export default function FitnessProfilePage() {
  return (
    <DetailLayout title="운동 프로필 관리" centered>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <FitnessContent />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
