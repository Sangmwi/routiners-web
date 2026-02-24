'use client';

import UnderlineTabs from '@/components/ui/UnderlineTabs';
import SegmentedControl from '@/components/ui/SegmentedControl';
import type { StatsPeriod } from '@/hooks/routine/useStatsPeriodNavigator';

export type StatsDomain = 'workout' | 'meal' | 'inbody';

const TABS = [
  { value: 'workout', label: '운동' },
  { value: 'meal', label: '식단' },
  { value: 'inbody', label: '인바디' },
] as const;

const PERIOD_OPTIONS = [
  { key: 'weekly' as const, label: '주간' },
  { key: 'monthly' as const, label: '월간' },
];

interface DomainTabsProps {
  domain: StatsDomain;
  onDomainChange: (domain: StatsDomain) => void;
  period: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
  /** false이면 주간/월간 토글 숨김 (인바디 탭 등) */
  showPeriodSelector?: boolean;
}

/**
 * 통계 도메인 탭
 *
 * [운동] [식단] [인바디]          [주간 | 월간]
 */
export default function DomainTabs({
  domain,
  onDomainChange,
  period,
  onPeriodChange,
  showPeriodSelector = true,
}: DomainTabsProps) {
  return (
    <UnderlineTabs
      tabs={TABS}
      value={domain}
      onChange={onDomainChange}
      layout="auto"
      rightSlot={
        showPeriodSelector ? (
          <SegmentedControl
            options={PERIOD_OPTIONS}
            value={period}
            onChange={onPeriodChange}
            size="md"
          />
        ) : undefined
      }
    />
  );
}
