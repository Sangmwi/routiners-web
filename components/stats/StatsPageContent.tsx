'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import PeriodNav from '@/components/ui/PeriodNav';
import DateJumpSheet from '@/components/ui/DateJumpSheet';
import SegmentedControl from '@/components/ui/SegmentedControl';
import DomainTabs, { type StatsDomain } from '@/components/stats/DomainTabs';
import WorkoutStatsTab from '@/components/stats/WorkoutStatsTab';
import BodyStatsTab from '@/components/stats/BodyStatsTab';
import NutritionStatsTab from '@/components/stats/NutritionStatsTab';
import { useStatsPeriodNavigator } from '@/hooks/routine/useStatsPeriodNavigator';
import { formatDate, parseDate } from '@/lib/utils/dateHelpers';

type RecordCount = '5' | '15' | 'all';

const COUNT_OPTIONS = [
  { key: '5' as const, label: '5개' },
  { key: '15' as const, label: '15개' },
  { key: 'all' as const, label: '모두' },
];

const COUNT_TO_LIMIT: Record<RecordCount, number> = {
  '5': 5,
  '15': 15,
  all: 100,
};

const VALID_TABS: StatsDomain[] = ['workout', 'meal', 'inbody'];

export default function StatsPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as StatsDomain | null;
  const initialTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'workout';
  const [domain, setDomain] = useState<StatsDomain>(initialTab);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const prevDomain = useRef(domain);

  const navigator = useStatsPeriodNavigator('weekly');

  const [recordCount, setRecordCount] = useState<RecordCount>('5');

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
        rightSlot={
          domain === 'inbody' ? (
            <SegmentedControl
              options={COUNT_OPTIONS}
              value={recordCount}
              onChange={setRecordCount}
              size="sm"
            />
          ) : undefined
        }
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
            <BodyStatsTab limit={COUNT_TO_LIMIT[recordCount]} />
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
