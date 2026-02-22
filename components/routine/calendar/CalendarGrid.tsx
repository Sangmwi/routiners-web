'use client';

import { BarbellIcon, ForkKnifeIcon } from '@phosphor-icons/react';
import type { CalendarEventSummary, EventStatus, EventType } from '@/lib/types/routine';
import { getDisplayStatus, getStatusConfig } from '@/lib/config/eventTheme';
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

function EventTypeIcon({
  type,
  className,
}: {
  type: EventType;
  className: string;
}) {
  if (type === 'meal') {
    return <ForkKnifeIcon className={className} />;
  }

  return <BarbellIcon className={className} />;
}

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
  return <EventTypeIcon type={type} className={`w-3.5 h-3.5 ${statusConfig.iconClass}`} />;
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
