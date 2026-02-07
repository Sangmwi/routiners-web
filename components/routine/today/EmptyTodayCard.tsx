'use client';

import AppLink from '@/components/common/AppLink';
import { BarbellIcon, ForkKnifeIcon, CaretRightIcon } from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils/dateHelpers';

interface EmptyTodayCardProps {
  type: 'workout' | 'meal';
}

/**
 * 빈 상태 표시
 * - TodayEventCard와 일관된 스타일
 * - 운동: 클릭 가능 (기록 페이지로 이동)
 * - 식단: 클릭 불가 (아직 미구현)
 */
export function EmptyTodayCard({ type }: EmptyTodayCardProps) {
  const isWorkout = type === 'workout';
  const today = formatDate(new Date());

  // 운동: 클릭 가능, 식단: 클릭 불가 (아직 미구현)
  if (isWorkout) {
    return (
      <AppLink
        href={`/routine/workout/${today}`}
        className="w-full flex items-center gap-4 px-2 py-5 active:bg-muted/30 transition-colors rounded-xl"
      >
        <BarbellIcon size={32} weight="duotone" className="text-muted-foreground/60 shrink-0" />
        <div className="flex-1 min-w-0 text-left">
          <h3 className="text-base font-medium text-muted-foreground">오늘 운동 없음</h3>
          <p className="text-sm text-muted-foreground/60 mt-1">기록을 추가해보세요</p>
        </div>
        <CaretRightIcon size={20} weight="bold" className="text-muted-foreground/50 shrink-0" />
      </AppLink>
    );
  }

  return (
    <div className="w-full flex items-center gap-4 px-2 py-5 active:bg-muted/30 transition-colors rounded-xl">
      <ForkKnifeIcon size={32} weight="duotone" className="text-muted-foreground/60 shrink-0" />
      <div className="flex-1 min-w-0 text-left">
        <h3 className="text-base font-medium text-muted-foreground">오늘 식단 없음</h3>
        <p className="text-sm text-muted-foreground/60 mt-1">곧 추가될 예정이에요</p>
      </div>
      <CaretRightIcon size={20} weight="bold" className="text-muted-foreground/50 shrink-0" />
    </div>
  );
}

export default EmptyTodayCard;
