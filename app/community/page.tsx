'use client';

import dynamic from 'next/dynamic';
import { PulseLoader } from '@/components/ui/PulseLoader';
import MainTabLayout from '@/components/common/MainTabLayout';
import MainTabHeader from '@/components/common/MainTabHeader';

const CommunityClient = dynamic(() => import('@/components/community/CommunityClient'), {
  ssr: false,
  loading: () => (
    <MainTabLayout>
      <MainTabHeader title="커뮤니티" />
      <PulseLoader />
    </MainTabLayout>
  ),
});

/**
 * 커뮤니티 페이지 (정적)
 *
 * ssr: false → 빌드 시 MainTabLayout + 헤더 + PulseLoader 셸 생성
 * 클라이언트: dynamic import → React Query 캐시 → 즉시 렌더
 */
export default function CommunityPage() {
  return <CommunityClient />;
}
