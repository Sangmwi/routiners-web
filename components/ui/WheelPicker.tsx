'use client';

import { useRef, useEffect } from 'react';

interface WheelPickerProps {
  /** 선택 가능한 옵션들 */
  options: { value: string; label: string }[];
  /** 현재 선택된 값 */
  value: string;
  /** 값 변경 핸들러 */
  onChange: (value: string) => void;
  /** 아이템 높이 (px) */
  itemHeight?: number;
  /** 표시할 아이템 개수 (홀수) */
  visibleItems?: number;
}

/**
 * WheelPicker
 *
 * iOS/Android 스타일 휠 피커
 * - 스크롤 스냅으로 자연스러운 선택
 * - 중앙 하이라이트
 * - 그라데이션 페이드 효과
 */
export function WheelPicker({
  options,
  value,
  onChange,
  itemHeight = 44,
  visibleItems = 5,
}: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // 선택된 값으로 스크롤
  useEffect(() => {
    if (isScrollingRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const selectedIndex = options.findIndex((opt) => opt.value === value);
    if (selectedIndex === -1) return;

    const scrollTop = selectedIndex * itemHeight;
    container.scrollTo({ top: scrollTop, behavior: 'smooth' });
  }, [value, options, itemHeight]);

  // 스크롤 종료 시 가장 가까운 아이템 선택
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    isScrollingRef.current = true;

    // debounce scroll end detection
    clearTimeout((container as unknown as { scrollTimeout?: number }).scrollTimeout);
    (container as unknown as { scrollTimeout?: number }).scrollTimeout = window.setTimeout(() => {
      const scrollTop = container.scrollTop;
      const selectedIndex = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(selectedIndex, options.length - 1));

      if (options[clampedIndex]?.value !== value) {
        onChange(options[clampedIndex].value);
      }

      // 정확한 위치로 스냅
      container.scrollTo({
        top: clampedIndex * itemHeight,
        behavior: 'smooth',
      });

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }, 100);
  };

  const containerHeight = itemHeight * visibleItems;
  const paddingItems = Math.floor(visibleItems / 2);

  return (
    <div
      className="relative"
      style={{ height: containerHeight }}
    >
      {/* Top gradient fade */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none bg-gradient-to-b from-card to-transparent"
        style={{ height: itemHeight * paddingItems }}
      />

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none bg-gradient-to-t from-card to-transparent"
        style={{ height: itemHeight * paddingItems }}
      />

      {/* Center highlight */}
      <div
        className="absolute left-0 right-0 z-0 pointer-events-none bg-primary/10 rounded-lg border-y border-primary/20"
        style={{
          top: itemHeight * paddingItems,
          height: itemHeight,
        }}
      />

      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide overscroll-contain"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
        onScroll={handleScroll}
      >
        {/* Top padding */}
        <div style={{ height: itemHeight * paddingItems }} />

        {/* Options */}
        {options.map((option) => (
          <div
            key={option.value}
            className={`
              flex items-center justify-center
              transition-all duration-150
              ${option.value === value ? 'text-foreground font-semibold' : 'text-muted-foreground'}
            `}
            style={{
              height: itemHeight,
              scrollSnapAlign: 'center',
            }}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </div>
        ))}

        {/* Bottom padding */}
        <div style={{ height: itemHeight * paddingItems }} />
      </div>
    </div>
  );
}

/**
 * YearMonthPicker
 *
 * 연월 선택을 위한 듀얼 휠 피커
 */
interface YearMonthPickerProps {
  year: string;
  month: string;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
  /** 선택 가능 연도 범위 (기본: 현재 ±3년) */
  yearRange?: { start: number; end: number };
}

export function YearMonthPicker({
  year,
  month,
  onYearChange,
  onMonthChange,
  yearRange,
}: YearMonthPickerProps) {
  const currentYear = new Date().getFullYear();
  const { start = currentYear - 3, end = currentYear + 1 } = yearRange || {};

  const years = Array.from({ length: end - start + 1 }, (_, i) => ({
    value: String(start + i),
    label: `${start + i}년`,
  }));

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: `${i + 1}월`,
  }));

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <p className="text-sm text-muted-foreground text-center mb-2">연도</p>
        <WheelPicker
          options={years}
          value={year}
          onChange={onYearChange}
        />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground text-center mb-2">월</p>
        <WheelPicker
          options={months}
          value={month}
          onChange={onMonthChange}
        />
      </div>
    </div>
  );
}
