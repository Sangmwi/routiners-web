'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const Big3Content = dynamic(
  () => import('@/components/profile/big3/Big3Content'),
  { ssr: false, loading: () => <PulseLoader /> },
);

/**
 * 3대운동 관리 페이지
 */
export default function Big3Page() {
  return (
    <DetailLayout title="3대운동" centered>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <Big3Content />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
