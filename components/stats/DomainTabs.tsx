'use client';

export type StatsDomain = 'status' | 'workout' | 'meal' | 'inbody';

interface DomainTabsProps {
  domain: StatsDomain;
  onDomainChange: (domain: StatsDomain) => void;
}

const TABS: { value: StatsDomain; label: string }[] = [
  { value: 'status', label: '현황' },
  { value: 'workout', label: '운동' },
  { value: 'meal', label: '식단' },
  { value: 'inbody', label: '인바디' },
];

/**
 * 통계 도메인 탭
 *
 * [현황] [운동] [식단] [인바디]
 */
export default function DomainTabs({ domain, onDomainChange }: DomainTabsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onDomainChange(tab.value)}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
            domain === tab.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
