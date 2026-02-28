'use client';

import { Suspense, use } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const UserPostFeedWrapper = dynamic(
  () => import('@/components/community/UserPostFeedWrapper'),
  { ssr: false }
);

export default function UserPostFeedPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);

  return (
    <DetailLayout title="게시글" centered>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <UserPostFeedWrapper userId={userId} />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
