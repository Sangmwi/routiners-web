'use client';

import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import {
  CalendarHeader,
  CalendarGrid,
  DayEventCard,
} from '@/components/routine';
import { useCalendarEvents, useRoutineEventByDate } from '@/hooks/routine';
import { Loader2 } from 'lucide-react';

/**
 * 전체 캘린더 페이지
 */
export default function RoutineCalendarPage() {
  // 현재 표시할 년/월
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  // 선택된 날짜
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(today));

  // 캘린더 이벤트 조회
  const { data: calendarEvents = [], isLoading: isLoadingCalendar } =
    useCalendarEvents(year, month);

  // 선택된 날짜의 이벤트 조회
  const { data: selectedEvent, isLoading: isLoadingEvent } =
    useRoutineEventByDate(selectedDate, 'workout');

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
    setSelectedDate(formatDate(today));
  };

  // 날짜 선택
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="전체 캘린더" />

      <div className="p-4 space-y-6">
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
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              events={calendarEvents}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}
        </div>

        {/* 선택된 날짜의 이벤트 */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            선택한 날짜
          </h2>
          {isLoadingEvent ? (
            <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <DayEventCard event={selectedEvent ?? null} date={selectedDate} />
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
