'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';
import DomainTabs, { type StatsDomain } from '@/components/routine/stats/DomainTabs';
import AchievementContent from '@/components/routine/stats/AchievementContent';
import WorkoutStatsTab from '@/components/routine/stats/WorkoutStatsTab';
import BodyStatsTab from '@/components/routine/stats/BodyStatsTab';
import NutritionStatsTab from '@/components/routine/stats/NutritionStatsTab';

const VALID_TABS: StatsDomain[] = ['status', 'workout', 'meal', 'inbody'];

function StatsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as StatsDomain | null;
  const initialTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'status';
  const [domain, setDomain] = useState<StatsDomain>(initialTab);

  return (
    <DetailLayout title="통계" centered>
      <DomainTabs domain={domain} onDomainChange={setDomain} />

      <div className="mt-4">
        {domain === 'status' && <AchievementContent />}
        {domain === 'workout' && <WorkoutStatsTab />}
        {domain === 'meal' && <NutritionStatsTab />}
        {domain === 'inbody' && (
          <QueryErrorBoundary>
            <Suspense fallback={<PulseLoader />}>
              <BodyStatsTab />
            </Suspense>
          </QueryErrorBoundary>
        )}
      </div>
    </DetailLayout>
  );
}

/**
 * 통계 페이지
 *
 * 도메인 탭 [현황/운동/식단/인바디] 구조
 * ?tab= 쿼리파라미터로 초기 탭 선택 지원
 */
export default function StatsPage() {
  return (
    <Suspense fallback={<PulseLoader />}>
      <StatsContent />
    </Suspense>
  );
}
