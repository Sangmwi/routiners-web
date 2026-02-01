'use client';

import { CheckIcon, SkipForwardIcon } from '@phosphor-icons/react';
import { getEventConfig } from '@/lib/config/theme';
import type { RoutineEvent, EventType, WorkoutData } from '@/lib/types/routine';
import type { MealData } from '@/lib/types/meal';
import AppLink from '@/components/common/AppLink';

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

interface EventCarouselCardProps {
  /** 이벤트 데이터 (null이면 쉬는 날) */
  event: RoutineEvent | null;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 이벤트 타입 */
  type: EventType;
  /** 네비게이션 경로 */
  href: string;
  /** 오늘 여부 */
  isToday?: boolean;
  /** 어제 여부 */
  isYesterday?: boolean;
  /** 내일 여부 */
  isTomorrow?: boolean;
}

// 타입별 스타일 헬퍼 (EVENT_TYPE에서 가져옴)
function getTypeStyles(type: EventType) {
  const config = getEventConfig(type);
  return {
    border: config.borderColor,
    bg: 'bg-primary/5',  // 캐러셀 카드용 더 연한 배경
    iconBg: config.bgColor,
    iconColor: config.color,
  };
}

/**
 * 캐러셀용 이벤트 카드
 *
 * - 이벤트 있음: 타입별 색상 + 제목/부제목
 * - 쉬는 날: dashed border + 휴식 아이콘
 * - 오늘/어제/내일: 오른쪽 위 뱃지
 * - 오늘: ring 강조
 * - 완료: 체크 아이콘
 */
export default function EventCarouselCard({
  event,
  date,
  type,
  href,
  isToday = false,
  isYesterday = false,
  isTomorrow = false,
}: EventCarouselCardProps) {
  const styles = getTypeStyles(type);
  const config = getEventConfig(type);
  const { dayNumber, dayOfWeek } = formatDateInfo(date);

  // 뱃지 렌더링
  const badge = isToday ? (
    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground rounded-md shadow-sm">
      오늘
    </span>
  ) : isYesterday ? (
    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded-md">
      어제
    </span>
  ) : isTomorrow ? (
    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded-md">
      내일
    </span>
  ) : null;

  // 쉬는 날 (이벤트 없음)
  if (!event) {
    return (
      <AppLink
        href={href}
        className={`
          relative flex flex-col items-center justify-center w-[140px] h-[180px] p-3 rounded-xl
          border border-dashed border-border bg-muted/30
          ${isToday ? 'ring-1 ring-primary' : ''}
          hover:bg-muted/50 transition-all
        `}
      >
        {badge}

        {/* 날짜 */}
        <span className="text-sm font-medium text-muted-foreground">
          {dayNumber}일 ({dayOfWeek})
        </span>

        {/* 휴식 아이콘 */}
        {(() => {
          const restConfig = getEventConfig('rest');
          return (
            <div className="flex-1 flex flex-col items-center justify-center gap-1">
              <restConfig.icon size={24} weight="fill" className="text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground">{restConfig.description}</span>
            </div>
          );
        })()}
      </AppLink>
    );
  }

  const isCompleted = event.status === 'completed';
  const isSkipped = event.status === 'skipped';
  const exerciseCount = isWorkoutData(event.data) ? event.data.exercises.length : 0;
  const mealCount = isMealData(event.data) ? event.data.meals.length : 0;

  return (
    <AppLink
      href={href}
      className={`
        relative flex flex-col items-center justify-center w-[140px] h-[180px] p-3 pt-4 rounded-xl
        ${styles.bg}
        ${isToday ? 'ring-1 ring-primary' : ''}
        hover:opacity-80 active:scale-[0.98] transition-all
      `}
    >
      {badge}

      {/* 날짜 */}
      <span
        className={`text-sm font-medium ${isToday ? 'text-foreground' : 'text-muted-foreground'
          }`}
      >
        {dayNumber}일 ({dayOfWeek})
      </span>

      <div className="flex-1 flex flex-col items-center justify-center gap-1">
        {/* 아이콘 */}
        <div
          className={`
          mt-2 w-10 h-10 rounded-xl flex items-center justify-center
          ${styles.iconBg}
        `}
        >
          {isCompleted ? (
            <CheckIcon size={20} weight="bold" className={styles.iconColor} />
          ) : isSkipped ? (
            <SkipForwardIcon size={20} weight="bold" className="text-muted-foreground" />
          ) : (
            <config.icon size={20} weight="fill" className={styles.iconColor} />
          )}
        </div>

        {/* 제목 */}
        <span
          className={`
          mt-2 text-xs font-medium text-center line-clamp-1 w-full
          ${isSkipped ? 'text-muted-foreground line-through' : 'text-foreground'}
        `}
        >
          {event.title}
        </span>

        {/* 부제목 */}
        {type === 'workout' && exerciseCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {exerciseCount}개 운동
          </span>
        )}
        {type === 'meal' && mealCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {mealCount}끼 식사
          </span>
        )}
      </div>
    </AppLink>
  );
}

// ============================================================================
// Helpers
// ============================================================================

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateInfo(dateStr: string): { dayNumber: number; dayOfWeek: string } {
  const date = new Date(dateStr);
  return {
    dayNumber: date.getDate(),
    dayOfWeek: WEEKDAYS[date.getDay()],
  };
}
