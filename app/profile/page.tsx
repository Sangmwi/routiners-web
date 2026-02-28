'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MainTabLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';
import ProfileHeader from '@/components/profile/ProfileHeader';

const ProfileContent = dynamic(
  () => import('@/components/profile/ProfileContent'),
  { ssr: false }
);

export default function ProfilePage() {
  return (
    <MainTabLayout>
      <ProfileHeader />
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <ProfileContent />
        </Suspense>
      </QueryErrorBoundary>
    </MainTabLayout>
  );
}
