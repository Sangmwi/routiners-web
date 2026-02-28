'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const ProfileEditContent = dynamic(
  () => import('@/components/profile/edit/ProfileEditContent'),
  { ssr: false }
);

export default function ProfileEditPage() {
  return (
    <DetailLayout title="프로필 편집" centered>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <ProfileEditContent />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
