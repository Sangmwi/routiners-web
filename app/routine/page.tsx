'use client';

import dynamic from 'next/dynamic';
import { PulseLoader } from '@/components/ui/PulseLoader';
import MainTabLayout from '@/components/common/MainTabLayout';
import MainTabHeader from '@/components/common/MainTabHeader';

const RoutineClient = dynamic(() => import('@/components/routine/RoutineClient'), {
  ssr: false,
  loading: () => (
    <MainTabLayout>
      <MainTabHeader title="내 루틴" />
      <PulseLoader />
    </MainTabLayout>
  ),
});

/**
 * 루틴 페이지 (정적)
 *
 * ssr: false → 빌드 시 MainTabLayout + 헤더 + PulseLoader 셸 생성
 * 클라이언트: dynamic import → React Query 캐시 → 즉시 렌더
 */
export default function RoutinePage() {
  return <RoutineClient />;
}
