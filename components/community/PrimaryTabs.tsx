'use client';

import { FunnelIcon } from '@phosphor-icons/react';
import UnderlineTabs from '@/components/ui/UnderlineTabs';

export type PrimaryTab = 'recommended' | 'following';

const TABS = [
  { value: 'recommended', label: '추천' },
  { value: 'following', label: '팔로잉' },
] as const;

interface PrimaryTabsProps {
  activeTab: PrimaryTab;
  onTabChange: (tab: PrimaryTab) => void;
  hasActiveFilter: boolean;
  onFilterOpen: () => void;
}

/**
 * 커뮤니티 메인 탭 (추천/팔로잉) + 필터 버튼
 */
export default function PrimaryTabs({
  activeTab,
  onTabChange,
  hasActiveFilter,
  onFilterOpen,
}: PrimaryTabsProps) {
  return (
    <UnderlineTabs
      tabs={TABS}
      value={activeTab}
      onChange={onTabChange}
      layout="auto"
      showBorder={false}
      rightSlot={
        <button
          type="button"
          onClick={onFilterOpen}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            hasActiveFilter
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50'
          }`}
          aria-label="필터"
        >
          <FunnelIcon
            size={14}
            weight={hasActiveFilter ? 'fill' : 'regular'}
          />
          필터
        </button>
      }
    />
  );
}
