'use client';

import { Suspense, use } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const PostDetailContent = dynamic(
  () => import('@/components/community/detail/PostDetailContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <DetailLayout title="게시글" centered>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <PostDetailContent postId={id} />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
