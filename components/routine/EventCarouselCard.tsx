'use client';

import { Dumbbell, Utensils, Check, SkipForward, Moon } from 'lucide-react';
import type { RoutineEvent, EventType } from '@/lib/types/routine';

interface EventCarouselCardProps {
  /** 이벤트 데이터 (null이면 쉬는 날) */
  event: RoutineEvent | null;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 이벤트 타입 */
  type: EventType;
  /** 오늘 여부 */
  isToday?: boolean;
  /** 어제 여부 */
  isYesterday?: boolean;
  /** 내일 여부 */
  isTomorrow?: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
}

// 타입별 스타일
const typeStyles = {
  workout: {
    border: 'border-workout/30',
    bg: 'bg-workout/5',
    iconBg: 'bg-workout/10',
    iconColor: 'text-workout',
  },
  meal: {
    border: 'border-meal/30',
    bg: 'bg-meal/5',
    iconBg: 'bg-meal/10',
    iconColor: 'text-meal',
  },
};

// 타입별 아이콘
const typeIcons = {
  workout: Dumbbell,
  meal: Utensils,
};

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
  isToday = false,
  isYesterday = false,
  isTomorrow = false,
  onClick,
}: EventCarouselCardProps) {
  const styles = typeStyles[type];
  const Icon = typeIcons[type];
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
      <button
        onClick={onClick}
        className={`
          relative flex flex-col items-center justify-center w-[120px] h-[140px] p-3 rounded-xl
          border border-dashed border-border bg-muted/30
          ${isToday ? 'ring-2 ring-primary' : ''}
          hover:bg-muted/50 transition-all
        `}
      >
        {badge}

        {/* 날짜 */}
        <span className="text-sm font-medium text-muted-foreground">
          {dayNumber}일 ({dayOfWeek})
        </span>

        {/* 휴식 아이콘 */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <Moon className="w-6 h-6 text-muted-foreground/60" />
          <span className="text-xs text-muted-foreground">쉬는 날</span>
        </div>
      </button>
    );
  }

  const isCompleted = event.status === 'completed';
  const isSkipped = event.status === 'skipped';
  const exerciseCount = event.data?.exercises?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center w-[120px] h-[140px] p-3 pt-4 rounded-xl
        border ${styles.border} ${styles.bg}
        ${isToday ? 'ring-2 ring-primary' : ''}
        hover:shadow-md active:scale-[0.98] transition-all
      `}
    >
      {badge}

      {/* 날짜 */}
      <span
        className={`text-sm font-medium ${
          isToday ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {dayNumber}일 ({dayOfWeek})
      </span>

      {/* 아이콘 */}
      <div
        className={`
          mt-2 w-10 h-10 rounded-xl flex items-center justify-center
          ${styles.iconBg}
        `}
      >
        {isCompleted ? (
          <Check className={`w-5 h-5 ${styles.iconColor}`} />
        ) : isSkipped ? (
          <SkipForward className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
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
    </button>
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
