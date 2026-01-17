'use client';

import { useRouter } from 'next/navigation';
import { CalendarEventSummary, EventType } from '@/lib/types/routine';
import { ChevronRight } from 'lucide-react';
import { getStatusConfig, getEventIcon, EventStatus } from '@/lib/config/eventTheme';

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
                ${isSelected ? 'bg-foreground/10' : ''}
                ${day.isToday && !isSelected ? 'ring-2 ring-foreground/30 ring-inset' : ''}
                ${!isSelected ? 'hover:bg-muted/50' : ''}
              `}
            >
              {/* 요일 */}
              <span
                className={`text-xs font-medium mb-1 ${
                  isSelected
                    ? 'text-foreground'
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
                    ? 'text-foreground'
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
                    type={day.event!.type}
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
  type,
  status,
  isSelected,
}: {
  type: EventType;
  status: EventStatus;
  isSelected: boolean;
}) {
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  // 아이콘이 있는 경우 (completed, skipped)
  if (StatusIcon) {
    const iconColor = isSelected
      ? 'text-foreground'
      : status === 'completed'
        ? 'text-primary'
        : 'text-muted-foreground';
    return <StatusIcon className={`w-3.5 h-3.5 ${iconColor}`} />;
  }

  // scheduled - 타입별 아이콘 표시
  const TypeIcon = getEventIcon(type);
  return (
    <TypeIcon
      className={`w-3.5 h-3.5 ${isSelected ? 'text-foreground' : 'text-amber-500'}`}
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
