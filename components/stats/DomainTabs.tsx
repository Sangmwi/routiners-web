'use client';

import UnderlineTabs from '@/components/ui/UnderlineTabs';

export type StatsDomain = 'status' | 'workout' | 'meal' | 'inbody';

const TABS = [
  { value: 'status', label: '현황' },
  { value: 'workout', label: '운동' },
  { value: 'meal', label: '식단' },
  { value: 'inbody', label: '인바디' },
] as const;

interface DomainTabsProps {
  domain: StatsDomain;
  onDomainChange: (domain: StatsDomain) => void;
}

/**
 * 통계 도메인 탭
 *
 * [현황] [운동] [식단] [인바디]
 */
export default function DomainTabs({ domain, onDomainChange }: DomainTabsProps) {
  return (
    <UnderlineTabs
      tabs={TABS}
      value={domain}
      onChange={onDomainChange}
      layout="equal"
    />
  );
}
