'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MainTabLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';
import ProfileHeader from '@/components/profile/ProfileHeader';

const ProfileContent = dynamic(
  () => import('@/components/profile/ProfileContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

/**
 * 프로필 페이지
 *
 * - Layout + Header: 즉시 렌더링 (Suspense 밖)
 * - 단일 Suspense: 번들 + 데이터 로딩 모두 처리
 * - 깜빡임 없는 로딩 UX
 */
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
