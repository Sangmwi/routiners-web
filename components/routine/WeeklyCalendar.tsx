'use client';

import { useRouter } from 'next/navigation';
import { CalendarEventSummary } from '@/lib/types/routine';
import { Check, SkipForward, ChevronRight } from 'lucide-react';

interface WeeklyCalendarProps {
  events: CalendarEventSummary[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

interface DayInfo {
  date: string;
  dayOfWeek: string;
  dayNumber: number;
  isToday: boolean;
  isPast: boolean;
  event?: CalendarEventSummary;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 주간 캘린더 컴포넌트
 * 이번 주 월~일 표시
 */
export default function WeeklyCalendar({
  events,
  selectedDate,
  onSelectDate,
}: WeeklyCalendarProps) {
  const router = useRouter();

  // 이번 주 날짜들 생성
  const weekDays = generateWeekDays(events);

  const handleDayClick = (date: string) => {
    if (onSelectDate) {
      onSelectDate(date);
    } else {
      router.push(`/routine/${date}`);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">이번 주</h2>
        <button
          onClick={() => router.push('/routine/calendar')}
          className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
        >
          전체보기
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 주간 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const isSelected = day.date === selectedDate;
          const hasEvent = !!day.event;

          return (
            <button
              key={day.date}
              onClick={() => handleDayClick(day.date)}
              className={`
                flex flex-col items-center py-2 rounded-lg transition-all
                ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                ${day.isToday && !isSelected ? 'ring-2 ring-primary ring-inset' : ''}
                ${!isSelected ? 'hover:bg-muted' : ''}
              `}
            >
              {/* 요일 */}
              <span
                className={`text-xs font-medium mb-1 ${
                  isSelected
                    ? 'text-primary-foreground'
                    : day.isPast
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground'
                }`}
              >
                {day.dayOfWeek}
              </span>

              {/* 날짜 */}
              <span
                className={`text-sm font-semibold mb-1 ${
                  isSelected
                    ? 'text-primary-foreground'
                    : day.isPast
                      ? 'text-muted-foreground'
                      : 'text-foreground'
                }`}
              >
                {day.dayNumber}
              </span>

              {/* 이벤트 인디케이터 */}
              <div className="h-4 flex items-center justify-center">
                {hasEvent && (
                  <EventIndicator
                    status={day.event!.status}
                    isSelected={isSelected}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EventIndicator({
  status,
  isSelected,
}: {
  status: 'scheduled' | 'completed' | 'skipped';
  isSelected: boolean;
}) {
  if (status === 'completed') {
    return (
      <Check
        className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-foreground' : 'text-primary'}`}
      />
    );
  }

  if (status === 'skipped') {
    return (
      <SkipForward
        className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`}
      />
    );
  }

  // scheduled
  return (
    <span
      className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-amber-500'}`}
    />
  );
}

// 이번 주 날짜들 생성
function generateWeekDays(events: CalendarEventSummary[]): DayInfo[] {
  const today = new Date();
  const todayStr = formatDate(today);

  // 이번 주 월요일 찾기
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const days: DayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = formatDate(date);

    days.push({
      date: dateStr,
      dayOfWeek: WEEKDAYS[(i + 1) % 7], // 월요일부터 시작
      dayNumber: date.getDate(),
      isToday: dateStr === todayStr,
      isPast: date < today && dateStr !== todayStr,
      event: events.find((e) => e.date === dateStr),
    });
  }

  return days;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
