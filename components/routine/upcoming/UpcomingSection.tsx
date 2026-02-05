'use client';

import AppLink from '@/components/common/AppLink';
import { CaretRight } from '@phosphor-icons/react';
import { UpcomingEventItem } from './UpcomingEventItem';
import { formatDate } from '@/lib/utils/dateHelpers';
import type { RoutineEvent } from '@/lib/types/routine';

interface UpcomingSectionProps {
  events: RoutineEvent[];
  maxItems?: number;
}

/**
 * 다가오는 일정 섹션
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
          다가오는 일정
        </h2>
        <AppLink
          href="/routine/calendar"
          className="text-sm font-medium text-primary flex items-center gap-0.5"
        >
          전체 보기
          <CaretRight size={16} weight="bold" />
        </AppLink>
      </div>

      {/* 이벤트 리스트 */}
      <div className="divide-y divide-border/50 px-2">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => (
            <UpcomingEventItem key={event.id} event={event} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">
            예정된 일정이 없습니다
          </p>
        )}
      </div>
    </section>
  );
}

export default UpcomingSection;
