'use client';

import AppLink from '@/components/common/AppLink';
import { BarbellIcon, ForkKnifeIcon, CaretRightIcon } from '@phosphor-icons/react';
import { getStatusConfig, getDisplayStatus } from '@/lib/config/eventTheme';
import type { RoutineEvent, EventType } from '@/lib/types/routine';
import { isWorkoutData, isMealData } from '@/lib/types/guards';

interface TodayEventCardProps {
  event: RoutineEvent;
  type: EventType;
}

/**
 * 오늘 이벤트 카드
 * - 플랫 리스트 아이템 스타일
 * - 아이콘 배경 없이 직접 표시
 * - 깔끔한 구분선으로 분리
 */
export function TodayEventCard({ event, type }: TodayEventCardProps) {
  const isWorkout = type === 'workout';
  const href = `/routine/${type}/${event.date}`;

  // 데이터에서 정보 추출
  const exerciseCount = isWorkoutData(event.data) ? event.data.exercises.length : 0;
  const estimatedMinutes = isWorkoutData(event.data) ? event.data.estimatedDuration : undefined;
  const mealCount = isMealData(event.data) ? event.data.meals.length : 0;

  // 부제목 생성
  const subtitle = isWorkout
    ? exerciseCount > 0
      ? `${exerciseCount}개 운동${estimatedMinutes ? ` · 약 ${estimatedMinutes}분` : ''}`
      : '운동 일정'
    : mealCount > 0
      ? `${mealCount}끼 식사`
      : '식단 일정';

  return (
    <AppLink
      href={href}
      className="w-full flex items-center gap-4 px-2 py-5 active:bg-muted/20 transition-colors rounded-xl"
    >
      {/* 아이콘 - 배경 없음, 32px */}
      {isWorkout ? (
        <BarbellIcon size={32} weight="fill" className="text-primary shrink-0" />
      ) : (
        <ForkKnifeIcon size={32} weight="fill" className="text-primary shrink-0" />
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-base font-semibold text-foreground truncate">
            {event.title}
          </h3>
          {(() => {
            const displayStatus = getDisplayStatus(event.status, event.date);
            const config = getStatusConfig(displayStatus);
            const StatusIcon = config.icon;
            return (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${config.badgeClass}`}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
            );
          })()}
        </div>
        <p className="text-sm text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {/* 화살표 */}
      <CaretRightIcon size={20} weight="bold" className="text-muted-foreground shrink-0" />
    </AppLink>
  );
}

export default TodayEventCard;
