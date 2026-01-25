'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import {
  CalendarHeader,
  CalendarGrid,
  DayEventCard,
  TypeFilterToggle,
} from '@/components/routine';
import { useCalendarEvents, useRoutineEventByDate } from '@/hooks/routine';
import type { EventType } from '@/lib/types/routine';
import { SpinnerGapIcon } from '@phosphor-icons/react';
import { formatKoreanDate, formatDate as formatDateISO } from '@/lib/utils/dateHelpers';
import { PulseLoader } from '@/components/ui/PulseLoader';

type FilterType = EventType | 'all';

/**
 * 전체 캘린더 페이지
 *
 * - URL ?type 파라미터로 필터 프리셋 지원
 * - 전체/운동/식단 토글 필터
 */
function CalendarPageContent() {
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

  // 캘린더 이벤트 조회
  const { data: calendarEvents = [], isPending: isLoadingCalendar } =
    useCalendarEvents(year, month);

  // 필터링된 캘린더 이벤트
  const filteredEvents =
    filterType === 'all'
      ? calendarEvents
      : calendarEvents.filter((event) => event.type === filterType);

  // 선택된 날짜의 운동 이벤트
  const { data: workoutEvent, isPending: isLoadingWorkout } =
    useRoutineEventByDate(selectedDate, 'workout');

  // 선택된 날짜의 식단 이벤트
  const { data: mealEvent, isPending: isLoadingMeal } =
    useRoutineEventByDate(selectedDate, 'meal');

  // 필터에 맞는 이벤트 선택
  const selectedEvent =
    filterType === 'workout'
      ? (workoutEvent ?? null)
      : filterType === 'meal'
        ? (mealEvent ?? null)
        : (workoutEvent ?? mealEvent ?? null);

  const isLoadingEvent = isLoadingWorkout || isLoadingMeal;

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
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="전체 캘린더" />

      <div className="p-4 space-y-4">
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

          {isLoadingCalendar ? (
            <div className="flex items-center justify-center py-12">
              <SpinnerGapIcon size={24} className="animate-spin text-primary" />
            </div>
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              events={filteredEvents}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}
        </div>

        {/* 선택된 날짜의 이벤트 */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            {selectedDate ? formatKoreanDate(selectedDate, { year: false, weekday: true, weekdayFormat: 'short' }) : '선택된 날짜'} {'루틴'}
          </h2>
          {isLoadingEvent ? (
            <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-center">
              <SpinnerGapIcon size={20} className="animate-spin text-primary" />
            </div>
          ) : (
            <DayEventCard event={selectedEvent} date={selectedDate} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Suspense boundary로 감싼 캘린더 페이지
 * useSearchParams 사용 시 Next.js App Router에서 필요
 */
export default function RoutineCalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <PageHeader title="전체 캘린더" />
          <PulseLoader />
        </div>
      }
    >
      <CalendarPageContent />
    </Suspense>
  );
}
