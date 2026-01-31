'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';

const ProfileEditContent = dynamic(
  () => import('@/components/profile/edit/ProfileEditContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

/**
 * 프로필 수정 페이지
 *
 * - DetailLayout + Header: 즉시 렌더링
 * - QueryErrorBoundary: 에러 처리
 * - Suspense: 데이터 로딩 처리
 */
export default function ProfileEditPage() {
  return (
    <DetailLayout title="프로필 만들기" centered>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <ProfileEditContent />
        </Suspense>
      </QueryErrorBoundary>
    </DetailLayout>
  );
}
