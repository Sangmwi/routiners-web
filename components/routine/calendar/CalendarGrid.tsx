'use client';

import type { CalendarEventSummary, EventStatus, EventType } from '@/lib/types/routine';
import { getDisplayStatus } from '@/lib/config/eventTheme';
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

const DOT_CLASS: Record<string, string> = {
  scheduled: 'bg-scheduled',
  completed: 'bg-primary',
  incomplete: 'bg-muted-foreground',
};

function EventDot({
  status,
  date,
}: {
  type: EventType;
  status: EventStatus;
  date: string;
}) {
  const displayStatus = getDisplayStatus(status, date);
  return <span className={`w-1.5 h-1.5 rounded-full ${DOT_CLASS[displayStatus]}`} />;
}

function indexEventsByDate(
  events: CalendarEventSummary[],
): Record<string, CalendarEventSummary[]> {
  return events.reduce<Record<string, CalendarEventSummary[]>>((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {});
}

function generateCalendarDays(
  year: number,
  month: number,
  eventsByDate: Record<string, CalendarEventSummary[]>,
): DayInfo[] {
  const result: DayInfo[] = [];
  const today = new Date();
  const todayStr = formatDate(today);

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

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

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month - 1, d);
    const dateStr = formatDate(date);

    result.push({
      date: dateStr,
      day: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      events: eventsByDate[dateStr] ?? [],
    });
  }

  const totalCells = result.length <= 35 ? 35 : 42;
  const remainingDays = totalCells - result.length;
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

export default function CalendarGrid({
  year,
  month,
  events,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const eventsByDate = indexEventsByDate(events);
  const days = generateCalendarDays(year, month, eventsByDate);

  return (
    <div>
      <div className="grid grid-cols-7 mb-4">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-2 ${
              index === 0 ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((dayInfo, index) => {
          const isSelected = dayInfo.date === selectedDate;
          const dayOfWeek = index % 7;

          return (
            <button
              key={dayInfo.date}
              type="button"
              onClick={() => onSelectDate(dayInfo.date)}
              className={`
                relative aspect-[5/7] flex flex-col items-center rounded-lg transition-all
                ${dayInfo.isCurrentMonth ? '' : 'opacity-30'}
                ${isSelected ? 'bg-foreground/10' : 'hover:bg-surface-muted'}
                ${dayInfo.isToday && !isSelected ? 'ring-2 ring-foreground/30 ring-inset' : ''}
              `}
            >
              <span
                className={`text-xs font-semibold leading-none mt-2 ${
                  !isSelected && dayInfo.isCurrentMonth
                    ? dayOfWeek === 0
                      ? 'text-destructive'
                      : 'text-foreground'
                    : ''
                }`}
              >
                {dayInfo.day}
              </span>

              <div className="flex-1 flex items-center">
                {dayInfo.events.length > 0 && (
                  <div className="flex items-center gap-1">
                    {[...dayInfo.events].sort((a, b) => (a.type === 'workout' ? 0 : 1) - (b.type === 'workout' ? 0 : 1)).map((event) => (
                      <EventDot
                        key={event.id}
                        type={event.type}
                        status={event.status}
                        date={dayInfo.date}
                      />
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
