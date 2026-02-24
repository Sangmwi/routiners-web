'use client';

import { useState } from 'react';
import { CalendarBlankIcon, BarbellIcon, BowlFoodIcon } from '@phosphor-icons/react';
import TypeFilterToggle, { type FilterValue } from '@/components/ui/TypeFilterToggle';
import ActivityRow from '@/components/ui/ActivityRow';
import DayGroup from '@/components/ui/DayGroup';
import { formatDate, getCountdownText } from '@/lib/utils/dateHelpers';
import { isWorkoutData, isMealData } from '@/lib/types/guards';
import type { RoutineEvent } from '@/lib/types/routine';

interface UpcomingSectionProps {
  events: RoutineEvent[];
  maxItems?: number;
}

function getEventMeta(event: RoutineEvent): string | undefined {
  if (event.type === 'workout' && isWorkoutData(event.data)) {
    const count = event.data.exercises.length;
    return count > 0 ? `${count}개` : undefined;
  }
  if (event.type === 'meal' && isMealData(event.data)) {
    const count = event.data.meals.length;
    return count > 0 ? `${count}끼` : undefined;
  }
  return undefined;
}

/**
 * 다가오는 루틴 섹션
 *
 * - 날짜별 그룹 레이아웃 (주간 기록 스타일)
 * - 날짜 라벨: 오늘 / 내일 / 모레 / n일 후
 * - [전체/운동/식단] 필터
 */
export function UpcomingSection({
  events,
  maxItems = 5,
}: UpcomingSectionProps) {
  const today = formatDate(new Date());
  const [filter, setFilter] = useState<FilterValue>('all');

  // 오늘 포함 이후 이벤트 필터링 + 정렬 + 제한
  const upcomingEvents = events
    .filter((e) => e.date >= today)
    .filter((e) => filter === 'all' || e.type === filter)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, maxItems);

  // 날짜별 그룹화
  const grouped = new Map<string, RoutineEvent[]>();
  for (const event of upcomingEvents) {
    const existing = grouped.get(event.date) || [];
    existing.push(event);
    grouped.set(event.date, existing);
  }

  return (
    <section>
      {/* 헤더 + 인라인 필터 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground shrink-0">
          다가오는 루틴
        </h2>
        <TypeFilterToggle value={filter} onChange={setFilter} size="sm" />
      </div>

      {/* 날짜별 그룹 리스트 */}
      {grouped.size > 0 ? (
        <div className="flex flex-col items-center overflow-hidden">
          {Array.from(grouped.entries()).map(([date, dayEvents]) => (
            <div key={date} className="w-full">
              <DayGroup
                dayLabel={getCountdownText(date)}
                isToday={date === today}
                labelWidth="w-12"
              >
                {dayEvents.map((event) => (
                  <ActivityRow
                    key={event.id}
                    icon={event.type === 'workout' ? BarbellIcon : BowlFoodIcon}
                    label={event.title || (event.type === 'workout' ? '운동' : '식단')}
                    meta={getEventMeta(event)}
                    href={`/routine/${event.type}/${event.date}`}
                    status={event.status}
                    date={event.date}
                  />
                ))}
              </DayGroup>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-surface-secondary p-4 text-center">
          <CalendarBlankIcon size={24} weight="duotone" className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            예정된 루틴이 없어요
          </p>
        </div>
      )}
    </section>
  );
}

export default UpcomingSection;
