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

const TABS: { value: StatsPeriod; label: string }[] = [
  { value: 'weekly', label: '주간' },
  { value: 'monthly', label: '월간' },
];

export default function PeriodTabs({
  period,
  onPeriodChange,
  label,
  onPrev,
  onNext,
  canGoNext,
}: PeriodTabsProps) {
  return (
    <div className="space-y-4">
      {/* 기간 탭 */}
      <div className="flex justify-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onPeriodChange(tab.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              period === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 날짜 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
        >
          <CaretLeftIcon size={18} weight="bold" />
        </button>

        <span className="text-sm text-muted-foreground font-medium">{label}</span>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className={`p-1.5 rounded-lg transition-colors ${
            canGoNext
              ? 'hover:bg-muted/50 text-muted-foreground'
              : 'text-muted-foreground/30 cursor-not-allowed'
          }`}
        >
          <CaretRightIcon size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
}
