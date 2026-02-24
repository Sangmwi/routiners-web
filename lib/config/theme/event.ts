import { BarbellIcon, BowlFoodIcon, CheckCircleIcon, XCircleIcon, ClockIcon, MoonIcon, SunIcon, CloudSunIcon, CoffeeIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT, type IconWeight } from './base';
import type { EventStatus } from '@/lib/types/routine';

export type EventType = 'workout' | 'meal' | 'rest';
export type DisplayStatus = 'scheduled' | 'completed' | 'incomplete';
export type MealTimeType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// 이벤트 타입 (EVENT_STATUS 패턴 적용 - 라벨/스타일 통합)
export const EVENT_TYPE = {
  workout: {
    icon: BarbellIcon,
    label: '운동',
    description: '운동 루틴',
    weight: ICON_WEIGHT.active as IconWeight,
    color: 'text-foreground',
    bgColor: 'bg-surface-accent',
    borderColor: 'border-edge-faint',
    badgeClass: 'bg-surface-accent-strong text-primary',
  },
  meal: {
    icon: BowlFoodIcon,
    label: '식단',
    description: '식단 관리',
    weight: ICON_WEIGHT.active as IconWeight,
    color: 'text-foreground',
    bgColor: 'bg-surface-accent',
    borderColor: 'border-edge-faint',
    badgeClass: 'bg-surface-accent-strong text-primary',
  },
  rest: {
    icon: MoonIcon,
    label: '휴식',
    description: '쉬는 날',
    weight: ICON_WEIGHT.inactive as IconWeight,
    color: 'text-muted-foreground',
    bgColor: 'bg-surface-secondary',
    borderColor: 'border-border',
    badgeClass: 'bg-muted text-muted-foreground',
  },
} as const;

// 이벤트 표시 상태 (DisplayStatus 기반)
export const EVENT_STATUS = {
  scheduled: {
    label: '예정',
    icon: ClockIcon,
    weight: ICON_WEIGHT.scheduled as IconWeight,       // 상태 아이콘 weight (duotone)
    eventIconWeight: ICON_WEIGHT.active as IconWeight,  // 이벤트 타입 아이콘 weight (fill)
    badgeClass: 'bg-surface-scheduled text-warning',
    eventIconClass: 'text-foreground/50',               // 이벤트 타입 아이콘 색상 (바벨/그릇)
    statusClass: 'text-scheduled',                      // 상태 텍스트 색상 (예정/완료/미완)
  },
  completed: {
    label: '완료',
    icon: CheckCircleIcon,
    weight: ICON_WEIGHT.completed as IconWeight,        // fill
    eventIconWeight: ICON_WEIGHT.active as IconWeight,  // fill
    badgeClass: 'bg-surface-accent text-primary',
    eventIconClass: 'text-primary',
    statusClass: 'text-primary',
  },
  incomplete: {
    label: '미완',
    icon: XCircleIcon,
    weight: ICON_WEIGHT.inactive as IconWeight,         // regular
    eventIconWeight: ICON_WEIGHT.inactive as IconWeight, // regular
    badgeClass: 'bg-surface-muted text-muted-foreground',
    eventIconClass: 'text-hint-faint',
    statusClass: 'text-hint-faint',
  },
} as const;

// 식사 시간대 (아침/점심/저녁/간식)
export const MEAL_TIME = {
  breakfast: {
    icon: SunIcon,
    label: '아침',
    weight: ICON_WEIGHT.active as IconWeight,
    color: 'text-muted-foreground',
    bgColor: 'bg-surface-secondary',
  },
  lunch: {
    icon: CloudSunIcon,
    label: '점심',
    weight: ICON_WEIGHT.active as IconWeight,
    color: 'text-muted-foreground',
    bgColor: 'bg-surface-secondary',
  },
  dinner: {
    icon: MoonIcon,
    label: '저녁',
    weight: ICON_WEIGHT.active as IconWeight,
    color: 'text-muted-foreground',
    bgColor: 'bg-surface-secondary',
  },
  snack: {
    icon: CoffeeIcon,
    label: '간식',
    weight: ICON_WEIGHT.inactive as IconWeight,
    color: 'text-muted-foreground',
    bgColor: 'bg-surface-secondary',
  },
} as const;

// 캘린더 아이콘 크기
export const CALENDAR_ICON = {
  mini: ICON_SIZE.sm,     // 월간 캘린더 점
  small: ICON_SIZE.md,    // 주간 캘린더
  card: ICON_SIZE.lg,     // 이벤트 카드
} as const;

// Namespace 객체 - IDE 자동완성용
export const EventIcons = {
  Workout: EVENT_TYPE.workout.icon,
  Meal: EVENT_TYPE.meal.icon,
  Rest: EVENT_TYPE.rest.icon,
} as const;

/**
 * DB EventStatus + date → UI DisplayStatus 변환
 *
 * - completed → completed
 * - scheduled + 과거 날짜 → incomplete (미완료)
 * - scheduled + 오늘/미래 → scheduled (예정)
 */
export function getDisplayStatus(status: EventStatus, eventDate: string): DisplayStatus {
  if (status === 'completed') return 'completed';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(eventDate + 'T00:00:00');
  if (date < today) return 'incomplete';
  return 'scheduled';
}

// 헬퍼 함수
export function getEventIcon(type: EventType) {
  return EVENT_TYPE[type]?.icon ?? EVENT_TYPE.workout.icon;
}

export function getEventLabel(type: EventType): string {
  return EVENT_TYPE[type]?.label ?? EVENT_TYPE.workout.label;
}

export function getStatusConfig(status: DisplayStatus) {
  return EVENT_STATUS[status];
}

export function getEventConfig(type: EventType) {
  return EVENT_TYPE[type] ?? EVENT_TYPE.workout;
}

export function getMealTimeConfig(type: MealTimeType) {
  return MEAL_TIME[type] ?? MEAL_TIME.lunch;
}
