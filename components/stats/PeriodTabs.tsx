'use client';

import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import SegmentedControl from '@/components/ui/SegmentedControl';

export type StatsPeriod = 'weekly' | 'monthly';

const PERIOD_OPTIONS = [
  { key: 'weekly' as const, label: '주간' },
  { key: 'monthly' as const, label: '월간' },
];

interface PeriodTabsProps {
  period: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
  /** 주간: "12월 29일 ~ 1월 4일", 월간: "2026년 2월" */
  label: string;
  /** 주간일 때 날짜 텍스트 위에 표시할 연도 (e.g. "2026년") */
  yearLabel?: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
  onDateLabelClick?: () => void;
  dateLabelAriaLabel?: string;
}

export default function PeriodTabs({
  period,
  onPeriodChange,
  label,
  yearLabel,
  onPrev,
  onNext,
  canGoNext,
  onDateLabelClick,
  dateLabelAriaLabel,
}: PeriodTabsProps) {
  const dateLabelNode = onDateLabelClick ? (
    <button
      type="button"
      onClick={onDateLabelClick}
      aria-label={dateLabelAriaLabel ?? '날짜 선택'}
      className="relative w-40 text-center text-sm text-muted-foreground font-medium hover:text-foreground transition-colors rounded-md px-1 py-0.5"
    >
      {yearLabel && (
        <span className="absolute -top-3.5 inset-x-0 text-xs text-muted-foreground/60">
          {yearLabel}
        </span>
      )}
      {label}
    </button>
  ) : (
    <span className="relative w-40 text-center text-sm text-muted-foreground font-medium">
      {yearLabel && (
        <span className="absolute -top-3.5 inset-x-0 text-xs text-muted-foreground/60">
          {yearLabel}
        </span>
      )}
      {label}
    </span>
  );

  return (
    <div className="flex items-center justify-between">
      {/* 날짜 네비게이션 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className="p-1.5 rounded-lg hover:bg-surface-muted transition-colors text-muted-foreground"
        >
          <CaretLeftIcon size={18} weight="bold" />
        </button>

        {dateLabelNode}

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className={`p-1.5 rounded-lg transition-colors ${
            canGoNext
              ? 'hover:bg-surface-muted text-muted-foreground'
              : 'text-muted-foreground/30 cursor-not-allowed'
          }`}
        >
          <CaretRightIcon size={18} weight="bold" />
        </button>
      </div>

      {/* 기간 토글 (세그먼트 컨트롤) */}
      <SegmentedControl
        options={PERIOD_OPTIONS}
        value={period}
        onChange={onPeriodChange}
        size="md"
      />
    </div>
  );
}
