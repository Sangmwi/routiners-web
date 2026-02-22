'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const SettingsContent = dynamic(
  () => import('@/components/settings/SettingsContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

export default function SettingsPage() {
  return (
    <DetailLayout title="설정" centered>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <SettingsContent />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
