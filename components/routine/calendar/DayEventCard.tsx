'use client';

import { RoutineEvent, WorkoutExercise } from '@/lib/types/routine';
import { DotsThreeVerticalIcon } from '@phosphor-icons/react';
import { getEventIcon, getStatusConfig } from '@/lib/config/eventTheme';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import { isWorkoutData, isMealData } from '@/lib/types/guards';
import AppLink from '@/components/common/AppLink';

interface DayEventCardProps {
  event: RoutineEvent | null;
  date: string;
  onMore?: (eventId: string) => void;
}

/**
 * 선택된 날짜의 이벤트 카드
 */
export default function DayEventCard({ event, date, onMore }: DayEventCardProps) {
  // 날짜 포맷
  const formattedDate = formatKoreanDate(date, { year: false, weekday: true });

  // 이벤트 없음
  if (!event) {
    return (
      <div className="bg-muted/20 rounded-xl p-5">
        <p className="text-sm text-muted-foreground mb-1">{formattedDate}</p>
        <p className="text-foreground">예정된 운동이 없어요.</p>
      </div>
    );
  }

  const status = getStatusConfig(event.status);
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center rounded-xl">
      <AppLink
        href={`/routine/${event.type}/${date}`}
        className="flex flex-1 items-center gap-4 px-2 py-5 text-left hover:bg-muted/20 active:bg-muted/20 transition-colors rounded-xl min-w-0"
      >
        {/* 아이콘 */}
        {(() => {
          const Icon = getEventIcon(event.type);
          return <Icon className="w-7 h-7 text-primary flex-shrink-0" />;
        })()}

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-semibold text-foreground truncate">
              {event.title}
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${status.badgeClass}`}
            >
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
              {status.label}
            </span>
          </div>

          {/* 요약 정보 */}
          <div className="text-sm text-muted-foreground">
            {event.data && isWorkoutData(event.data) && event.data.exercises.length > 0 && (
              <span>
                {event.data.exercises.length}개 운동 · {getTotalSets(event.data.exercises)}세트
              </span>
            )}
            {event.data && isMealData(event.data) && event.data.meals.length > 0 && (
              <span>
                {event.data.meals.length}끼 · {event.data.estimatedTotalCalories || event.data.targetCalories || 0}kcal
              </span>
            )}
            {!event.data && event.rationale && (
              <span className="line-clamp-1">{event.rationale}</span>
            )}
          </div>
        </div>

      </AppLink>

      {/* 더보기 메뉴 */}
      {onMore && (
        <button
          type="button"
          onClick={() => onMore(event.id)}
          className="p-2.5 -mr-1 shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          aria-label="더보기"
        >
          <DotsThreeVerticalIcon size={20} weight="bold" />
        </button>
      )}
    </div>
  );
}

function getTotalSets(exercises: WorkoutExercise[]): number {
  return exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
}
