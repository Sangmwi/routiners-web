'use client';

import { CalendarEventSummary, EventType, EventStatus } from '@/lib/types/routine';
import { getStatusConfig, getEventIcon, getDisplayStatus } from '@/lib/config/eventTheme';
import { formatDate } from '@/lib/utils/dateHelpers';

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
  events: CalendarEventSummary[];
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 캘린더 그리드 컴포넌트
 *
 * - 날짜별 이벤트 인디케이터 표시
 * - 상태별 색상: 완료(primary), 예정(primary/60), 미완료(muted)
 */
export default function CalendarGrid({
  year,
  month,
  events,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  // 캘린더 날짜 데이터 생성
  const days = generateCalendarDays(year, month, events);

  return (
    <div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-4">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-2 ${
              index === 0
                ? 'text-destructive'
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
                ${isSelected ? 'bg-foreground/10' : 'hover:bg-muted/50'}
                ${dayInfo.isToday && !isSelected ? 'ring-2 ring-foreground/30 ring-inset' : ''}
              `}
            >
              <span
                className={`text-sm font-medium ${
                  !isSelected && dayInfo.isCurrentMonth
                    ? dayOfWeek === 0
                      ? 'text-destructive'
                      : 'text-foreground'
                    : ''
                }`}
              >
                {dayInfo.day}
              </span>

              {/* 이벤트 인디케이터 (타입별) */}
              {dayInfo.events.length > 0 && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {dayInfo.events.map((event) => (
                    <EventDot
                      key={event.id}
                      type={event.type}
                      status={event.status}
                      date={dayInfo.date}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 이벤트 타입/상태 표시 미니 아이콘
function EventDot({
  type,
  status,
  date,
}: {
  type: EventType;
  status: EventStatus;
  date: string;
}) {
  const displayStatus = getDisplayStatus(status, date);
  const statusConfig = getStatusConfig(displayStatus);
  const Icon = getEventIcon(type);
  return <Icon className={`w-3.5 h-3.5 ${statusConfig.iconClass}`} />;
}

// 캘린더 날짜 데이터 생성
function generateCalendarDays(
  year: number,
  month: number,
  events: CalendarEventSummary[]
): DayInfo[] {
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
      events: [],
    });
  }

  // 이번 달 날짜들
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month - 1, d);
    const dateStr = formatDate(date);
    const dayEvents = events.filter((e) => e.date === dateStr);

    result.push({
      date: dateStr,
      day: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      events: dayEvents,
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
      events: [],
    });
  }

  return result;
}

