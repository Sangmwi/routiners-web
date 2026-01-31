'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const InBodyContent = dynamic(
  () => import('@/components/profile/inbody/InBodyContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

/**
 * 인바디 관리 페이지
 *
 * - DetailLayout + Header: 즉시 렌더링
 * - QueryErrorBoundary: 에러 처리
 * - Suspense: 데이터 로딩 처리
 */
export default function InBodyPage() {
  return (
    <DetailLayout title="인바디 관리" centered>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <InBodyContent />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
