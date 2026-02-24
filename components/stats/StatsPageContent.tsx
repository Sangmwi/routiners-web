'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import PeriodNav from '@/components/ui/PeriodNav';
import DateJumpSheet from '@/components/ui/DateJumpSheet';
import { PulseLoader } from '@/components/ui/PulseLoader';
import DomainTabs, { type StatsDomain } from '@/components/stats/DomainTabs';
import WorkoutStatsTab from '@/components/stats/WorkoutStatsTab';
import BodyStatsTab from '@/components/stats/BodyStatsTab';
import NutritionStatsTab from '@/components/stats/NutritionStatsTab';
import { useStatsPeriodNavigator } from '@/hooks/routine/useStatsPeriodNavigator';
import { formatDate, parseDate } from '@/lib/utils/dateHelpers';

const VALID_TABS: StatsDomain[] = ['workout', 'meal', 'inbody'];

export default function StatsPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as StatsDomain | null;
  const initialTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'workout';
  const [domain, setDomain] = useState<StatsDomain>(initialTab);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const prevDomain = useRef(domain);

  const navigator = useStatsPeriodNavigator('weekly');

  const [isDateJumpOpen, setIsDateJumpOpen] = useState(false);
  const [dateJumpSession, setDateJumpSession] = useState(0);

  const today = new Date();
  const todayStr = formatDate(today);
  const startYear = today.getFullYear() - 5;
  const minDate = `${startYear}-01-01`;

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
      <DomainTabs
        domain={domain}
        onDomainChange={setDomain}
        period={navigator.period}
        onPeriodChange={navigator.setPeriod}
        showPeriodSelector={domain !== 'inbody'}
      />

      {domain !== 'inbody' && (
        <PeriodNav
          label={navigator.label}
          onPrev={navigator.handlePrev}
          onNext={navigator.handleNext}
          canGoNext={navigator.canGoNext}
          onLabelClick={() => {
            setDateJumpSession((prev) => prev + 1);
            setIsDateJumpOpen(true);
          }}
          labelAriaLabel={navigator.period === 'weekly' ? '주간 날짜 선택' : '월간 날짜 선택'}
        />
      )}

      <div className="[overflow-x:clip]">
        <div
          key={domain}
          className="animate-tab-slide"
          style={{
            '--slide-from': direction === 'right' ? '30px' : '-30px',
          } as React.CSSProperties}
        >
          {domain === 'workout' && <WorkoutStatsTab navigator={navigator} />}
          {domain === 'meal' && <NutritionStatsTab navigator={navigator} />}
          {domain === 'inbody' && (
            <QueryErrorBoundary>
              <Suspense fallback={<PulseLoader />}>
                <BodyStatsTab />
              </Suspense>
            </QueryErrorBoundary>
          )}
        </div>
      </div>

      {navigator.period === 'weekly' ? (
        <DateJumpSheet
          key={`date-${dateJumpSession}`}
          mode="date"
          isOpen={isDateJumpOpen}
          onClose={() => setIsDateJumpOpen(false)}
          title="주간 날짜 선택"
          value={navigator.weekDateStr}
          minDate={minDate}
          maxDate={todayStr}
          onConfirm={({ date }) => {
            navigator.setWeekBaseDate(parseDate(date));
          }}
        />
      ) : (
        <DateJumpSheet
          key={`month-${dateJumpSession}`}
          mode="yearMonth"
          isOpen={isDateJumpOpen}
          onClose={() => setIsDateJumpOpen(false)}
          title="월간 날짜 선택"
          year={String(navigator.monthYear.year)}
          month={String(navigator.monthYear.month).padStart(2, '0')}
          yearRange={{ start: startYear, end: today.getFullYear() }}
          onConfirm={({ year, month }) => {
            navigator.setMonthYear({
              year: parseInt(year, 10),
              month: parseInt(month, 10),
            });
          }}
        />
      )}
    </>
  );
}
