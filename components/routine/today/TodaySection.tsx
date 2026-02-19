'use client';

import { TodayEventCard } from './TodayEventCard';
import { EmptyTodayCard } from './EmptyTodayCard';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import type { RoutineEvent } from '@/lib/types/routine';

interface TodaySectionProps {
  workoutEvent: RoutineEvent | null;
  mealEvent: RoutineEvent | null;
}

/**
 * 오늘의 루틴 섹션
 * - 날짜 표시 + 구분선으로 아이템 분리
 * - 간결한 플랫 스타일
 */
export function TodaySection({ workoutEvent, mealEvent }: TodaySectionProps) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-foreground">오늘</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {formatKoreanDate(new Date(), { weekday: true })}
        </p>
      </div>

      <div>
        {workoutEvent ? (
          <TodayEventCard event={workoutEvent} type="workout" />
        ) : (
          <EmptyTodayCard type="workout" />
        )}

        <div className="mx-2 border-t border-border/40" />

        {mealEvent ? (
          <TodayEventCard event={mealEvent} type="meal" />
        ) : (
          <EmptyTodayCard type="meal" />
        )}
      </div>
    </section>
  );
}

export default TodaySection;
