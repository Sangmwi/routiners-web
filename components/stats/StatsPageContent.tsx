'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
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
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const prevDomain = useRef(domain);

  useEffect(() => {
    if (prevDomain.current !== domain) {
      const prevIdx = VALID_TABS.indexOf(prevDomain.current);
      const nextIdx = VALID_TABS.indexOf(domain);
      setDirection(nextIdx > prevIdx ? 'right' : 'left');
      prevDomain.current = domain;
    }
  }, [domain]);

  return (
    <>
      <DomainTabs domain={domain} onDomainChange={setDomain} />

      <div className="mt-2 [overflow-x:clip]">
        <div
          key={domain}
          className="animate-tab-slide"
          style={{
            '--slide-from': direction === 'right' ? '30px' : '-30px',
          } as React.CSSProperties}
        >
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
      </div>
    </>
  );
}
