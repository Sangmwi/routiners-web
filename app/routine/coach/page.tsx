'use client';

import dynamic from 'next/dynamic';
import { PulseLoader } from '@/components/ui/PulseLoader';
import MainTabLayout from '@/components/common/MainTabLayout';
import MainTabHeader from '@/components/common/MainTabHeader';

const CoachPageClient = dynamic(
  () => import('./CoachPageClient').then(mod => ({ default: mod.CoachPageClient })),
  {
    ssr: false,
    loading: () => (
      <MainTabLayout>
        <MainTabHeader title="AI 코치" />
        <PulseLoader />
      </MainTabLayout>
    ),
  },
);

/**
 * 코치 채팅 페이지 (정적)
 *
 * ssr: false → 빌드 시 MainTabLayout + 헤더 + PulseLoader 셸 생성
 * 클라이언트: dynamic import → React Query 캐시 → 즉시 렌더
 */
export default function CoachPage() {
  return <CoachPageClient />;
}
