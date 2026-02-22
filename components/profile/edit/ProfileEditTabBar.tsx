'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

const TABS = [
  { value: 'basic', label: '기본' },
  { value: 'details', label: '상세' },
  { value: 'military', label: '군 정보' },
] as const;

export type EditTab = (typeof TABS)[number]['value'];

interface ProfileEditTabBarProps {
  activeTab: EditTab;
  onTabChange: (tab: EditTab) => void;
}

/**
 * 프로필 편집 탭바 (모션 언더라인)
 */
export default function ProfileEditTabBar({ activeTab, onTabChange }: ProfileEditTabBarProps) {
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
    <div ref={containerRef} className="relative border-b border-border">
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
            {tab.label}
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
