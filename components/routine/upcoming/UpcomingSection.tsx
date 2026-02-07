'use client';

import AppLink from '@/components/common/AppLink';
import { CaretRightIcon, CalendarBlankIcon } from '@phosphor-icons/react';
import { UpcomingEventItem } from './UpcomingEventItem';
import { formatDate } from '@/lib/utils/dateHelpers';
import type { RoutineEvent } from '@/lib/types/routine';

interface UpcomingSectionProps {
  events: RoutineEvent[];
  maxItems?: number;
}

/**
 * 다가오는 루틴 섹션
 * - 구분선으로 아이템 분리
 * - 간결한 헤더
 */
export function UpcomingSection({
  events,
  maxItems = 5
}: UpcomingSectionProps) {
  const today = formatDate(new Date());

  // 오늘 이후의 이벤트만 필터링하고 날짜순 정렬
  const upcomingEvents = events
    .filter(e => e.date > today)
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
          전체 보기
          <CaretRightIcon size={16} weight="bold" />
        </AppLink>
      </div>

      {/* 이벤트 리스트 */}
      {upcomingEvents.length > 0 ? (
        <div className="divide-y divide-border/50">
          {upcomingEvents.map((event) => (
            <UpcomingEventItem key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-muted/30 p-4 text-center">
          <CalendarBlankIcon size={24} weight="duotone" className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            예정된 루틴이 없습니다
          </p>
        </div>
      )}
    </section>
  );
}

export default UpcomingSection;
