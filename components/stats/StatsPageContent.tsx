'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';
import DomainTabs, { type StatsDomain } from '@/components/stats/DomainTabs';
import AchievementContent from '@/components/stats/AchievementContent';
import WorkoutStatsTab from '@/components/stats/WorkoutStatsTab';
import BodyStatsTab from '@/components/stats/BodyStatsTab';
import NutritionStatsTab from '@/components/stats/NutritionStatsTab';

const VALID_TABS: StatsDomain[] = ['status', 'workout', 'meal', 'inbody'];

export default function StatsPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as StatsDomain | null;
  const initialTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'status';
  const [domain, setDomain] = useState<StatsDomain>(initialTab);

  return (
    <>
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
    </>
  );
}
