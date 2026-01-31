'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarHeader,
  CalendarGrid,
  DayEventCard,
  TypeFilterToggle,
} from '@/components/routine';
import {
  useCalendarEventsSuspense,
  useRoutineEventByDateSuspense,
} from '@/hooks/routine';
import type { EventType } from '@/lib/types/routine';
import { formatKoreanDate, formatDate as formatDateISO } from '@/lib/utils/dateHelpers';

type FilterType = EventType | 'all';

/**
 * 캘린더 콘텐츠 (Suspense 내부)
 *
 * - useSuspenseQuery로 데이터 로딩
 * - 상위 page.tsx의 DetailLayout에서 Suspense 처리
 */
export default function CalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL에서 초기 필터 값 읽기
  const typeParam = searchParams.get('type') as EventType | null;
  const initialFilter: FilterType = typeParam || 'all';
  const [filterType, setFilterType] = useState<FilterType>(initialFilter);

  // 현재 표시할 년/월
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  // 선택된 날짜
  const [selectedDate, setSelectedDate] = useState<string>(formatDateISO(today));

  // Suspense 쿼리: 캘린더 이벤트 (캐시되어 있으면 즉시 반환)
  const { data: calendarEvents } = useCalendarEventsSuspense(year, month);

  // Suspense 쿼리: 선택된 날짜의 이벤트들
  const { data: workoutEvent } = useRoutineEventByDateSuspense(selectedDate, 'workout');
  const { data: mealEvent } = useRoutineEventByDateSuspense(selectedDate, 'meal');

  // 필터링된 캘린더 이벤트
  const filteredEvents =
    filterType === 'all'
      ? calendarEvents
      : calendarEvents.filter((event) => event.type === filterType);

  // 필터에 맞는 이벤트 선택
  const selectedEvent =
    filterType === 'workout'
      ? (workoutEvent ?? null)
      : filterType === 'meal'
        ? (mealEvent ?? null)
        : (workoutEvent ?? mealEvent ?? null);

  // 필터 변경 핸들러 (URL 동기화)
  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    if (type === 'all') {
      router.replace('/routine/calendar');
    } else {
      router.replace(`/routine/calendar?type=${type}`);
    }
  };

  // 이전/다음 달 이동
  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  // 오늘로 이동
  const handleToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setSelectedDate(formatDateISO(today));
  };

  // 날짜 선택
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <div className="space-y-4">
      {/* 타입 필터 토글 */}
      <TypeFilterToggle value={filterType} onChange={handleFilterChange} />

      {/* 캘린더 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <CalendarHeader
          year={year}
          month={month}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />

        <CalendarGrid
          year={year}
          month={month}
          events={filteredEvents}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      </div>

      {/* 선택된 날짜의 이벤트 */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          {selectedDate
            ? formatKoreanDate(selectedDate, {
                year: false,
                weekday: true,
                weekdayFormat: 'short',
              })
            : '선택된 날짜'}{' '}
          루틴
        </h2>
        <DayEventCard event={selectedEvent} date={selectedDate} />
      </div>
    </div>
  );
}
