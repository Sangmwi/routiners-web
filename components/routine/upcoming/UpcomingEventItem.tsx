'use client';

import AppLink from '@/components/common/AppLink';
import { BarbellIcon, ForkKnifeIcon, CaretRightIcon } from '@phosphor-icons/react';
import { formatDate, getDayOfWeek } from '@/lib/utils/dateHelpers';
import type { RoutineEvent } from '@/lib/types/routine';
import { isWorkoutData, isMealData } from '@/lib/types/guards';

interface UpcomingEventItemProps {
  event: RoutineEvent;
}

/**
 * 상대적 날짜 라벨 반환
 */
function getRelativeDateLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = formatDate(today);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  if (dateStr === todayStr) return '오늘';
  if (dateStr === tomorrowStr) return '내일';

  return getDayOfWeek(dateStr) + '요일';
}

/**
 * 컴팩트한 예정 이벤트 아이템
 * - 플랫 스타일, 아이콘 배경 없음
 * - 구분선으로 분리
 */
export function UpcomingEventItem({ event }: UpcomingEventItemProps) {
  const isWorkout = event.type === 'workout';
  const dateLabel = getRelativeDateLabel(event.date);

  // 데이터에서 정보 추출
  const exerciseCount = isWorkoutData(event.data) ? event.data.exercises.length : 0;
  const mealCount = isMealData(event.data) ? event.data.meals.length : 0;

  const subtitle = isWorkout
    ? exerciseCount > 0 ? `${exerciseCount}개` : ''
    : mealCount > 0 ? `${mealCount}끼` : '';

  return (
    <AppLink
      href={`/routine/${event.type}/${event.date}`}
      className="w-full flex items-center gap-3 px-2 py-3.5 active:bg-muted/20 transition-colors rounded-xl"
    >
      {/* 날짜 */}
      <span className="text-sm text-muted-foreground w-14 shrink-0 text-left">
        {dateLabel}
      </span>

      {/* 아이콘 - 배경 없음, 20px */}
      {isWorkout ? (
        <BarbellIcon size={20} weight="fill" className="text-primary shrink-0" />
      ) : (
        <ForkKnifeIcon size={20} weight="fill" className="text-primary shrink-0" />
      )}

      {/* 제목 + 상세 - flex 구조로 분리 */}
      <div className="flex-1 min-w-0 flex items-baseline gap-1.5 text-left">
        <span className="text-sm text-foreground truncate">
          {event.title || (isWorkout ? '운동' : '식단')}
        </span>
        {subtitle && (
          <span className="text-sm text-muted-foreground shrink-0">{subtitle}</span>
        )}
      </div>

      {/* 화살표 */}
      <CaretRightIcon size={16} className="text-muted-foreground/50 shrink-0" />
    </AppLink>
  );
}

export default UpcomingEventItem;
