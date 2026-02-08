import { BarbellIcon, ForkKnifeIcon, CheckCircleIcon, SkipForwardIcon, ClockIcon, MoonIcon, SunIcon, CloudSunIcon, CoffeeIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT, type IconWeight } from './base';

export type EventType = 'workout' | 'meal' | 'rest';
export type EventStatus = 'scheduled' | 'completed' | 'skipped';
export type MealTimeType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// 이벤트 타입 (EVENT_STATUS 패턴 적용 - 라벨/스타일 통합)
export const EVENT_TYPE = {
  workout: {
    icon: BarbellIcon,
    label: '운동',
    description: '운동 루틴',
    weight: ICON_WEIGHT.active as IconWeight,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    badgeClass: 'bg-primary/15 text-primary',
  },
  meal: {
    icon: ForkKnifeIcon,
    label: '식단',
    description: '식단 관리',
    weight: ICON_WEIGHT.active as IconWeight,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    badgeClass: 'bg-primary/15 text-primary',
  },
  rest: {
    icon: MoonIcon,
    label: '휴식',
    description: '쉬는 날',
    weight: ICON_WEIGHT.inactive as IconWeight,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    borderColor: 'border-border',
    badgeClass: 'bg-muted text-muted-foreground',
  },
} as const;

// 이벤트 상태
export const EVENT_STATUS = {
  scheduled: {
    label: '예정',
    icon: ClockIcon,
    weight: ICON_WEIGHT.scheduled as IconWeight,    // duotone
    badgeClass: 'bg-scheduled/10 text-warning',
    iconClass: 'text-scheduled',
  },
  completed: {
    label: '완료',
    icon: CheckCircleIcon,
    weight: ICON_WEIGHT.completed as IconWeight,    // fill
    badgeClass: 'bg-primary text-primary-foreground',
    iconClass: 'text-primary',
  },
  skipped: {
    label: '건너뜀',
    icon: SkipForwardIcon,
    weight: ICON_WEIGHT.skipped as IconWeight,      // thin
    badgeClass: 'bg-muted-foreground text-white',
    iconClass: 'text-muted-foreground',
  },
} as const;

// 식사 시간대 (아침/점심/저녁/간식)
export const MEAL_TIME = {
  breakfast: {
    icon: SunIcon,
    label: '아침',
    weight: ICON_WEIGHT.active as IconWeight,
    color: 'text-scheduled',
    bgColor: 'bg-scheduled/10',
  },
  lunch: {
    icon: CloudSunIcon,
    label: '점심',
    weight: ICON_WEIGHT.active as IconWeight,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  dinner: {
    icon: MoonIcon,
    label: '저녁',
    weight: ICON_WEIGHT.active as IconWeight,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
  snack: {
    icon: CoffeeIcon,
    label: '간식',
    weight: ICON_WEIGHT.inactive as IconWeight,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
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

// 헬퍼 함수
export function getEventIcon(type: EventType) {
  return EVENT_TYPE[type]?.icon ?? EVENT_TYPE.workout.icon;
}

export function getEventLabel(type: EventType): string {
  return EVENT_TYPE[type]?.label ?? EVENT_TYPE.workout.label;
}

export function getStatusConfig(status: EventStatus) {
  return EVENT_STATUS[status];
}

export function getEventConfig(type: EventType) {
  return EVENT_TYPE[type] ?? EVENT_TYPE.workout;
}

export function getMealTimeConfig(type: MealTimeType) {
  return MEAL_TIME[type] ?? MEAL_TIME.lunch;
}
