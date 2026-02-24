'use client';

import type { ReactNode } from 'react';
import UnderlineTabs from '@/components/ui/UnderlineTabs';
import type { StatsPeriod } from '@/hooks/routine/useStatsPeriodNavigator';
import SegmentedControl from '@/components/ui/SegmentedControl';

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
  /** 우측 슬롯 커스텀 (인바디 개수 토글 등) */
  rightSlot?: ReactNode;
}

/**
 * 통계 도메인 탭
 *
 * [운동] [식단] [인바디]          [주간 | 월간] or [5개 | 15개 | 모두]
 */
export default function DomainTabs({
  domain,
  onDomainChange,
  period,
  onPeriodChange,
  rightSlot,
}: DomainTabsProps) {
  const slot =
    rightSlot !== undefined ? rightSlot : (
      <SegmentedControl
        options={PERIOD_OPTIONS}
        value={period}
        onChange={onPeriodChange}
        size="md"
      />
    );

  return (
    <UnderlineTabs
      tabs={TABS}
      value={domain}
      onChange={onDomainChange}
      layout="auto"
      showBorder={false}
      rightSlot={slot}
    />
  );
}
