'use client';

import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

/**
 * 캘린더 헤더 (년월 + 네비게이션)
 */
export default function CalendarHeader({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  const monthName = new Date(year, month - 1).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex items-center justify-between py-4">
      <h2 className="text-xl font-bold text-foreground">{monthName}</h2>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="이전 달"
        >
          <CaretLeftIcon size={20} weight="bold" className="text-foreground" />
        </button>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="다음 달"
        >
          <CaretRightIcon size={20} weight="bold" className="text-foreground" />
        </button>
      </div>
    </div>
  );
}
