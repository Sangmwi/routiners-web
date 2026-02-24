'use client';

import PeriodNav from '@/components/ui/PeriodNav';

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthLabelClick?: () => void;
}

/**
 * 캘린더 헤더 — PeriodNav 래퍼
 *
 * <     2026년 2월     >
 */
export default function CalendarHeader({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onMonthLabelClick,
}: CalendarHeaderProps) {
  return (
    <PeriodNav
      label={`${year}년 ${month}월`}
      onPrev={onPrevMonth}
      onNext={onNextMonth}
      canGoNext={true}
      onLabelClick={onMonthLabelClick}
      labelAriaLabel="월 선택"
    />
  );
}
