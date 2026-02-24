'use client';

import { Suspense } from 'react';
import { CalendarGrid } from '@/components/routine';
import DayEventSection from './DayEventSection';
import { useCalendarEventsSuspense } from '@/hooks/routine';
import { PulseLoader } from '@/components/ui/PulseLoader';
import type { EventType } from '@/lib/types/routine';

type FilterType = EventType | 'all';

interface CalendarContentProps {
  year: number;
  month: number;
  isPending: boolean;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  filter?: FilterType;
}

/**
 * 캘린더 콘텐츠
 *
 * PeriodNav + DateJumpSheet는 부모(RoutineContent)에서 관리
 * startTransition도 부모에서 처리 → isPending prop으로 전달
 */
export default function CalendarContent({
  year,
  month,
  isPending,
  selectedDate,
  onSelectDate,
  filter: externalFilter,
}: CalendarContentProps) {
  const filterType: FilterType = externalFilter ?? 'all';

  // Suspense 쿼리: 캘린더 이벤트
  const { data: calendarEvents } = useCalendarEventsSuspense(year, month);

  // 필터링된 캘린더 이벤트
  const filteredEvents =
    filterType === 'all'
      ? calendarEvents
      : calendarEvents.filter((event) => event.type === filterType);

  return (
    <div className="space-y-4">
      {/* 캘린더 (transition 중 opacity 변화) */}
      <div
        className={`transition-opacity ${isPending ? 'opacity-60' : ''}`}
      >
        <CalendarGrid
          year={year}
          month={month}
          events={filteredEvents}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
        />
      </div>

      <hr className="border-edge-subtle" />

      {/* 선택된 날짜의 이벤트 (독립 Suspense) */}
      <Suspense fallback={<PulseLoader className="py-8" />}>
        <DayEventSection date={selectedDate} filterType={filterType} />
      </Suspense>
    </div>
  );
}
