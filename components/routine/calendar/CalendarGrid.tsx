'use client';

import { useMemo } from 'react';
import { CalendarEventSummary } from '@/lib/types/routine';

interface CalendarGridProps {
  year: number;
  month: number;
  events: CalendarEventSummary[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

interface DayInfo {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  event?: CalendarEventSummary;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 캘린더 그리드 컴포넌트
 */
export default function CalendarGrid({
  year,
  month,
  events,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  // 캘린더 날짜 데이터 생성
  const days = useMemo(() => {
    const result: DayInfo[] = [];
    const today = new Date();
    const todayStr = formatDate(today);

    // 이번 달 첫째날, 마지막날
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // 이전 달 날짜들 (일요일 시작)
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, -i);
      result.push({
        date: formatDate(date),
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // 이번 달 날짜들
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month - 1, d);
      const dateStr = formatDate(date);
      const event = events.find((e) => e.date === dateStr);

      result.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        event,
      });
    }

    // 다음 달 날짜들 (6주 맞추기)
    const remainingDays = 42 - result.length;
    for (let d = 1; d <= remainingDays; d++) {
      const date = new Date(year, month, d);
      result.push({
        date: formatDate(date),
        day: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return result;
  }, [year, month, events]);

  return (
    <div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-2 ${
              index === 0
                ? 'text-destructive'
                : index === 6
                  ? 'text-primary'
                  : 'text-muted-foreground'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((dayInfo, index) => {
          const isSelected = dayInfo.date === selectedDate;
          const dayOfWeek = index % 7;

          return (
            <button
              key={dayInfo.date}
              onClick={() => onSelectDate(dayInfo.date)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all
                ${dayInfo.isCurrentMonth ? '' : 'opacity-30'}
                ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                ${dayInfo.isToday && !isSelected ? 'ring-2 ring-primary ring-inset' : ''}
              `}
            >
              <span
                className={`text-sm font-medium ${
                  !isSelected && dayInfo.isCurrentMonth
                    ? dayOfWeek === 0
                      ? 'text-destructive'
                      : dayOfWeek === 6
                        ? 'text-primary'
                        : 'text-foreground'
                    : ''
                }`}
              >
                {dayInfo.day}
              </span>

              {/* 이벤트 인디케이터 */}
              {dayInfo.event && (
                <div className="absolute bottom-1 flex gap-0.5">
                  <EventDot status={dayInfo.event.status} isSelected={isSelected} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 이벤트 상태 표시 점
function EventDot({
  status,
  isSelected,
}: {
  status: 'scheduled' | 'completed' | 'skipped';
  isSelected: boolean;
}) {
  const colorClass = isSelected
    ? 'bg-primary-foreground'
    : status === 'completed'
      ? 'bg-primary'
      : status === 'skipped'
        ? 'bg-muted-foreground'
        : 'bg-amber-500';

  return <span className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />;
}

// 날짜 포맷 (YYYY-MM-DD)
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
