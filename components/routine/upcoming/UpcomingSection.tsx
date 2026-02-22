'use client';

import { useState } from 'react';
import AppLink from '@/components/common/AppLink';
import { CaretRightIcon, CalendarBlankIcon } from '@phosphor-icons/react';
import TypeFilterToggle, { type FilterValue } from '@/components/ui/TypeFilterToggle';
import { UpcomingEventItem } from './UpcomingEventItem';
import { formatDate } from '@/lib/utils/dateHelpers';
import type { RoutineEvent } from '@/lib/types/routine';

interface UpcomingSectionProps {
  events: RoutineEvent[];
  maxItems?: number;
}

/**
 * 다가오는 루틴 섹션
 * - [전체/운동/식단] 필터 칩
 * - 구분선으로 아이템 분리
 */
export function UpcomingSection({
  events,
  maxItems = 5
}: UpcomingSectionProps) {
  const today = formatDate(new Date());
  const [filter, setFilter] = useState<FilterValue>('all');

  // 오늘 이후의 이벤트만 필터링하고 날짜순 정렬
  const upcomingEvents = events
    .filter(e => e.date > today)
    .filter(e => filter === 'all' || e.type === filter)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, maxItems);

  return (
    <section>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">
          다가오는 루틴
        </h2>
        <AppLink
          href="/routine/calendar"
          className="text-sm font-medium text-primary flex items-center gap-0.5"
        >
          캘린더
          <CaretRightIcon size={16} weight="bold" />
        </AppLink>
      </div>

      {/* 필터 */}
      <div className="mb-4">
        <TypeFilterToggle value={filter} onChange={setFilter} />
      </div>

      {/* 이벤트 리스트 */}
      {upcomingEvents.length > 0 ? (
        <div className="flex flex-col items-center">
          {upcomingEvents.map((event, index) => (
            <div key={event.id} className="w-full">
              <UpcomingEventItem event={event} />
              {index < upcomingEvents.length - 1 && (
                <div className="w-8 h-px bg-border/50 mx-auto" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-muted/20 p-4 text-center">
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
