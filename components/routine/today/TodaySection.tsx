'use client';

import { BedIcon } from '@phosphor-icons/react';
import { TodayEventCard } from './TodayEventCard';
import { EmptyTodayCard } from './EmptyTodayCard';
import { formatKoreanDate, getCountdownText } from '@/lib/utils/dateHelpers';
import type { RoutineEvent } from '@/lib/types/routine';

interface TodaySectionProps {
  workoutEvent: RoutineEvent | null;
  mealEvent: RoutineEvent | null;
  nextScheduledWorkout?: RoutineEvent | null;
}

/**
 * 오늘의 루틴 섹션
 * - 날짜 표시 + 구분선으로 아이템 분리
 * - 간결한 플랫 스타일
 */
export function TodaySection({ workoutEvent, mealEvent, nextScheduledWorkout }: TodaySectionProps) {
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
        ) : nextScheduledWorkout ? (
          <div className="w-full flex items-center gap-4 px-2 py-5">
            <BedIcon size={32} weight="duotone" className="text-muted-foreground/60 shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <h3 className="text-base font-medium text-muted-foreground">오늘은 쉬는날</h3>
              <p className="text-sm text-muted-foreground/60 mt-1">
                다음 운동 {getCountdownText(nextScheduledWorkout.date)} · {formatKoreanDate(nextScheduledWorkout.date, { year: false, weekday: true, weekdayFormat: 'short' })}
              </p>
            </div>
          </div>
        ) : (
          <EmptyTodayCard type="workout" />
        )}

        <div className="mx-2 border-t border-edge-faint" />

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
