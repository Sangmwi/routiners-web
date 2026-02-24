'use client';

import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import TypeFilterToggle, { type FilterValue } from '@/components/ui/TypeFilterToggle';

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthLabelClick?: () => void;
  /** 이벤트 타입 필터 */
  filterValue?: FilterValue;
  onFilterChange?: (type: FilterValue) => void;
}

/**
 * 캘린더 헤더 (< 년월 > + 필터)
 *
 * PeriodTabs와 동일한 레이아웃 패턴:
 * [< 날짜 라벨 >]  [필터 토글]
 */
export default function CalendarHeader({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onMonthLabelClick,
  filterValue,
  onFilterChange,
}: CalendarHeaderProps) {
  const monthName = formatKoreanDate(new Date(year, month - 1), { day: false });

  const dateLabelNode = onMonthLabelClick ? (
    <button
      type="button"
      onClick={onMonthLabelClick}
      aria-label="월 선택"
      className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors rounded-md px-1 py-0.5"
    >
      {monthName}
    </button>
  ) : (
    <span className="text-sm text-muted-foreground font-medium">
      {monthName}
    </span>
  );

  return (
    <div className="flex items-center justify-between py-4">
      {/* 날짜 네비게이션 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-1.5 rounded-lg hover:bg-surface-muted transition-colors text-muted-foreground"
          aria-label="이전 달"
        >
          <CaretLeftIcon size={18} weight="bold" />
        </button>

        {dateLabelNode}

        <button
          type="button"
          onClick={onNextMonth}
          className="p-1.5 rounded-lg hover:bg-surface-muted transition-colors text-muted-foreground"
          aria-label="다음 달"
        >
          <CaretRightIcon size={18} weight="bold" />
        </button>
      </div>

      {/* 타입 필터 토글 */}
      {filterValue !== undefined && onFilterChange && (
        <TypeFilterToggle value={filterValue} onChange={onFilterChange} />
      )}
    </div>
  );
}
