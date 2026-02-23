'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { FunnelIcon } from '@phosphor-icons/react';

export type PrimaryTab = 'recommended' | 'following';

const TABS: { value: PrimaryTab; label: string }[] = [
  { value: 'recommended', label: '추천' },
  { value: 'following', label: '팔로잉' },
];

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>(
      `[data-tab="${activeTab}"]`
    );
    if (!activeBtn) return;
    setIndicator({
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
    });
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  return (
    <div className="flex items-center justify-between">
      {/* 좌측: 탭 버튼 + 인디케이터 */}
      <div ref={containerRef} className="relative flex">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            data-tab={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`px-4 py-3 text-md font-semibold transition-colors ${
              activeTab === tab.value
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {/* Animated underline indicator */}
        <div
          className="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>

      {/* 우측: 필터 버튼 */}
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
    </div>
  );
}
