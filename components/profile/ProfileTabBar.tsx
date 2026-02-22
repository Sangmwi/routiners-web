'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { LockSimpleIcon } from '@phosphor-icons/react';

const TABS = [
  { value: 'activity', label: '활동' },
  { value: 'info', label: '정보' },
] as const;

export type ProfileTab = (typeof TABS)[number]['value'];

interface ProfileTabBarProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  /** 비공개 상태인 탭 목록 */
  privateTabs?: ProfileTab[];
}

export default function ProfileTabBar({ activeTab, onTabChange, privateTabs = [] }: ProfileTabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>(`[data-tab="${activeTab}"]`);
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
    <div ref={containerRef} className="relative mt-6 border-b border-border">
      <div className="flex">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            data-tab={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              activeTab === tab.value
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            <span className="inline-flex items-center gap-1">
              {tab.label}
              {privateTabs.includes(tab.value) && (
                <LockSimpleIcon size={12} weight="bold" className="text-muted-foreground/60" />
              )}
            </span>
          </button>
        ))}
      </div>
      {/* Animated indicator */}
      <div
        className="absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  );
}
