'use client';

import dynamic from 'next/dynamic';
import { PulseLoader } from '@/components/ui/PulseLoader';
import MainTabLayout from '@/components/common/MainTabLayout';
import MainTabHeader from '@/components/common/MainTabHeader';

const ProfileClient = dynamic(() => import('@/components/profile/ProfileClient'), {
  ssr: false,
  loading: () => (
    <MainTabLayout>
      <MainTabHeader title="내 프로필" />
      <PulseLoader />
    </MainTabLayout>
  ),
});

/**
 * 프로필 페이지 (정적)
 *
 * ssr: false → 빌드 시 MainTabLayout + 헤더 + PulseLoader 셸 생성
 * 클라이언트: dynamic import → React Query 캐시 → 즉시 렌더
 */
export default function ProfilePage() {
  return <ProfileClient />;
}
