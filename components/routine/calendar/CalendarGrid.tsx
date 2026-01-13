'use client';

import { CalendarEventSummary, EventType } from '@/lib/types/routine';

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
 * - 운동: 🟠 (orange), 식단: 🟢 (green)
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

              {/* 이벤트 인디케이터 (타입별) */}
              {dayInfo.events.length > 0 && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {dayInfo.events.map((event) => (
                    <EventDot
                      key={event.id}
                      type={event.type}
                      status={event.status}
                      isSelected={isSelected}
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

// 이벤트 타입/상태 표시 점
function EventDot({
  type,
  status,
  isSelected,
}: {
  type: EventType;
  status: 'scheduled' | 'completed' | 'skipped';
  isSelected: boolean;
}) {
  // 선택된 셀이면 흰색
  if (isSelected) {
    return <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />;
  }

  // 건너뛴 이벤트
  if (status === 'skipped') {
    return <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />;
  }

  // 타입별 색상
  const typeColors = {
    workout: status === 'completed' ? 'bg-teal-500' : 'bg-teal-500/60',
    meal: status === 'completed' ? 'bg-lime-500' : 'bg-lime-500/60',
  };

  return <span className={`w-1.5 h-1.5 rounded-full ${typeColors[type]}`} />;
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

// 날짜 포맷 (YYYY-MM-DD)
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
