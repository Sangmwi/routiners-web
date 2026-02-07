'use client';

import AppLink from '@/components/common/AppLink';
import { BarbellIcon, ForkKnifeIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { RoutineEvent, EventType, WorkoutData } from '@/lib/types/routine';
import type { MealData } from '@/lib/types/meal';

interface TodayEventCardProps {
  event: RoutineEvent;
  type: EventType;
}

/**
 * 타입 가드: WorkoutData인지 확인
 */
function isWorkoutData(data: unknown): data is WorkoutData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'exercises' in data &&
    Array.isArray((data as WorkoutData).exercises)
  );
}

/**
 * 타입 가드: MealData인지 확인
 */
function isMealData(data: unknown): data is MealData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'meals' in data &&
    Array.isArray((data as MealData).meals)
  );
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
      className="w-full flex items-center gap-4 px-2 py-5 active:bg-muted/30 transition-colors rounded-xl"
    >
      {/* 아이콘 - 배경 없음, 32px */}
      {isWorkout ? (
        <BarbellIcon size={32} weight="fill" className="text-primary shrink-0" />
      ) : (
        <ForkKnifeIcon size={32} weight="fill" className="text-primary shrink-0" />
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0 text-left">
        <h3 className="text-base font-semibold text-foreground truncate">
          {event.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {subtitle}
        </p>
      </div>

      {/* 화살표 */}
      <CaretRightIcon size={20} weight="bold" className="text-muted-foreground shrink-0" />
    </AppLink>
  );
}

export default TodayEventCard;
