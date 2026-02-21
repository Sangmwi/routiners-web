'use client';

import { Suspense, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarHeader,
  CalendarGrid,
  TypeFilterToggle,
} from '@/components/routine';
import DayEventSection from './DayEventSection';
import { useCalendarEventsSuspense } from '@/hooks/routine';
import { PulseLoader } from '@/components/ui/PulseLoader';
import type { EventType } from '@/lib/types/routine';
import { formatDate as formatDateISO } from '@/lib/utils/dateHelpers';

type FilterType = EventType | 'all';

/**
 * 캘린더 콘텐츠
 *
 * Suspense 경계 분리 + startTransition:
 * - 초기 로딩: 전체 Suspense fallback
 * - 월 변경: startTransition → 기존 UI 유지 + 백그라운드 로딩
 * - 날짜 변경: DayEventSection만 Suspense
 */
export default function CalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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

  // Suspense 쿼리: 캘린더 이벤트
  const { data: calendarEvents } = useCalendarEventsSuspense(year, month);

  // 필터링된 캘린더 이벤트
  const filteredEvents =
    filterType === 'all'
      ? calendarEvents
      : calendarEvents.filter((event) => event.type === filterType);

  // 필터 변경 핸들러 (URL 동기화)
  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    if (type === 'all') {
      router.replace('/routine/calendar');
    } else {
      router.replace(`/routine/calendar?type=${type}`);
    }
  };

  // 이전/다음 달 이동 (startTransition으로 기존 UI 유지)
  const handlePrevMonth = () => {
    startTransition(() => {
      if (month === 1) {
        setYear(year - 1);
        setMonth(12);
      } else {
        setMonth(month - 1);
      }
    });
  };

  const handleNextMonth = () => {
    startTransition(() => {
      if (month === 12) {
        setYear(year + 1);
        setMonth(1);
      } else {
        setMonth(month + 1);
      }
    });
  };

  // 날짜 선택
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <div className="space-y-4">
      {/* 타입 필터 토글 */}
      <TypeFilterToggle value={filterType} onChange={handleFilterChange} />

      {/* 캘린더 (transition 중 opacity 변화) */}
      <div
        className={`bg-muted/20 rounded-2xl p-4 transition-opacity ${
          isPending ? 'opacity-60' : ''
        }`}
      >
        <CalendarHeader
          year={year}
          month={month}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        <CalendarGrid
          year={year}
          month={month}
          events={filteredEvents}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      </div>

      {/* 선택된 날짜의 이벤트 (독립 Suspense) */}
      <Suspense fallback={<PulseLoader className="py-8" />}>
        <DayEventSection date={selectedDate} filterType={filterType} />
      </Suspense>
    </div>
  );
}
