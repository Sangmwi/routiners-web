'use client';

import { type ReactNode, useRef, useState, useEffect } from 'react';

// ============================================================
// Types
// ============================================================

interface Tab<T extends string> {
  readonly value: T;
  readonly label: string;
  /** 라벨 옆에 표시할 아이콘 (잠금 아이콘 등) */
  icon?: ReactNode;
}

interface UnderlineTabsProps<T extends string> {
  /** 탭 목록 */
  tabs: readonly Tab<T>[];
  /** 현재 활성 탭 */
  value: T;
  /** 탭 변경 콜백 */
  onChange: (value: T) => void;
  /** equal: 모든 탭 동일 너비 (flex-1), auto: 컨텐츠 기반 너비 */
  layout?: 'equal' | 'auto';
  /** 우측 슬롯 (필터 버튼 등) */
  rightSlot?: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 하단 border 표시 여부 (기본: true) */
  showBorder?: boolean;
}

// ============================================================
// Component
// ============================================================

/**
 * 공통 밑줄 인디케이터 탭 컴포넌트
 *
 * DomainTabs, PrimaryTabs, ProfileTabBar, ProfileEditTabBar의 공통 로직을 통합.
 *
 * @example
 * // 기본 사용 (동일 너비)
 * <UnderlineTabs tabs={TABS} value={active} onChange={setActive} />
 *
 * // 자연 너비 + 우측 슬롯
 * <UnderlineTabs tabs={TABS} value={active} onChange={setActive} layout="auto" rightSlot={<FilterButton />} />
 */
export default function UnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
  layout = 'equal',
  rightSlot,
  className = '',
  showBorder = true,
}: UnderlineTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLButtonElement>(
      `[data-tab="${value}"]`
    );
    if (!activeBtn) return;
    setIndicator({
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
    });
  }, [value]);

  const tabContainer = (
    <div
      ref={containerRef}
      className={`relative ${showBorder ? 'border-b border-border' : ''} ${
        rightSlot ? '' : 'w-full'
      } ${className}`.trim()}
    >
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            data-tab={tab.value}
            onClick={() => onChange(tab.value)}
            className={`${layout === 'equal' ? 'flex-1' : 'px-4'} py-3.5 text-base font-medium text-center transition-colors ${
              value === tab.value
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {tab.icon ? (
              <span className="inline-flex items-center gap-1">
                {tab.label}
                {tab.icon}
              </span>
            ) : (
              tab.label
            )}
          </button>
        ))}
      </div>
      {/* Animated indicator */}
      <div
        className="absolute bottom-0 h-[3px] bg-primary rounded-full transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  );

  if (rightSlot) {
    return (
      <div className="flex items-center justify-between">
        {tabContainer}
        {rightSlot}
      </div>
    );
  }

  return tabContainer;
}
