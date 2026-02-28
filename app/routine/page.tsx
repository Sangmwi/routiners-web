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
