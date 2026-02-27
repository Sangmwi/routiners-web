'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const PostWriteContent = dynamic(
  () => import('@/components/community/write/PostWriteContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

function PostWriteInner() {
  const searchParams = useSearchParams();
  const postId = searchParams.get('postId');
  const isEdit = !!postId;

  return (
    <DetailLayout title={isEdit ? '글 수정' : '글쓰기'} centered padding={false} bottomInset='none'>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <PostWriteContent editPostId={postId} />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}

export default function PostWritePage() {
  return (
    <Suspense fallback={<PulseLoader />}>
      <PostWriteInner />
    </Suspense>
  );
}
