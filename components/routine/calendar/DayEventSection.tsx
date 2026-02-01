'use client';

import { DayEventCard } from '@/components/routine';
import { useRoutineEventByDateSuspense } from '@/hooks/routine';
import type { EventType } from '@/lib/types/routine';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

type FilterType = EventType | 'all';

interface DayEventSectionProps {
  date: string;
  filterType: FilterType;
}

/**
 * 선택된 날짜의 이벤트 섹션 (Suspense 내부)
 *
 * - 독립적인 Suspense 경계로 분리
 * - 날짜/필터 변경 시 이 영역만 로딩
 * - 캘린더 그리드는 영향받지 않음
 */
export default function DayEventSection({ date, filterType }: DayEventSectionProps) {
  // Suspense 쿼리: 선택된 날짜의 이벤트들
  const { data: workoutEvent } = useRoutineEventByDateSuspense(date, 'workout');
  const { data: mealEvent } = useRoutineEventByDateSuspense(date, 'meal');

  // 필터에 맞는 이벤트 선택
  const selectedEvent =
    filterType === 'workout'
      ? (workoutEvent ?? null)
      : filterType === 'meal'
        ? (mealEvent ?? null)
        : (workoutEvent ?? mealEvent ?? null);

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        {formatKoreanDate(date, {
          year: false,
          weekday: true,
          weekdayFormat: 'short',
        })}{' '}
        루틴
      </h2>
      <DayEventCard event={selectedEvent} date={date} />
    </div>
  );
}
