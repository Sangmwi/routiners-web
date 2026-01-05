'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

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
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-foreground">{monthName}</h2>
        <button
          onClick={onToday}
          className="px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
        >
          오늘
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="이전 달"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="다음 달"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </div>
  );
}
