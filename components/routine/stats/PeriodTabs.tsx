'use client';

import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

export type StatsPeriod = 'weekly' | 'monthly';

interface PeriodTabsProps {
  period: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
  label: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
}

/**
 * 기간 선택 + 날짜 네비게이션 (1행 통합)
 *
 * 좌: < 날짜 라벨 >    우: [주간|월간] 세그먼트 토글
 */
export default function PeriodTabs({
  period,
  onPeriodChange,
  label,
  onPrev,
  onNext,
  canGoNext,
}: PeriodTabsProps) {
  return (
    <div className="flex items-center justify-between">
      {/* 날짜 네비게이션 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className="p-1 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
        >
          <CaretLeftIcon size={16} weight="bold" />
        </button>

        <span className="text-sm text-muted-foreground font-medium">{label}</span>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className={`p-1 rounded-lg transition-colors ${
            canGoNext
              ? 'hover:bg-muted/50 text-muted-foreground'
              : 'text-muted-foreground/30 cursor-not-allowed'
          }`}
        >
          <CaretRightIcon size={16} weight="bold" />
        </button>
      </div>

      {/* 기간 토글 (세그먼트 컨트롤) */}
      <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => onPeriodChange('weekly')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
            period === 'weekly'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          주간
        </button>
        <button
          type="button"
          onClick={() => onPeriodChange('monthly')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
            period === 'monthly'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          월간
        </button>
      </div>
    </div>
  );
}
