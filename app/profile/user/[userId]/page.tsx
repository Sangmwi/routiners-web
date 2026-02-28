'use client';

import { Suspense, use } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const UserProfileContent = dynamic(
  () => import('@/components/profile/UserProfileContent'),
  { ssr: false }
);

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);

  return (
    <DetailLayout title="프로필" centered>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <UserProfileContent userId={userId} />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
