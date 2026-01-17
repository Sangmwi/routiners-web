import { Zap, Utensils, Check, SkipForward, type LucideIcon } from 'lucide-react';

export type EventType = 'workout' | 'meal';
export type EventStatus = 'scheduled' | 'completed' | 'skipped';

/**
 * 이벤트 타입별 설정 (브랜드 컬러 통일)
 * 운동/식단 구분은 아이콘으로만
 */
export const EVENT_TYPE_CONFIG = {
  workout: {
    icon: Zap,
    label: '운동',
  },
  meal: {
    icon: Utensils,
    label: '식단',
  },
} as const;

/**
 * 이벤트 상태별 설정
 */
export const EVENT_STATUS_CONFIG = {
  scheduled: {
    label: '예정',
    icon: null as null,
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    dotClass: 'bg-primary/60',
    iconClass: 'text-primary/60',
  },
  completed: {
    label: '완료',
    icon: Check,
    badgeClass: 'bg-primary text-primary-foreground',
    dotClass: 'bg-primary',
    iconClass: 'text-primary',
  },
  skipped: {
    label: '건너뜀',
    icon: SkipForward,
    badgeClass: 'bg-muted-foreground text-white',
    dotClass: 'bg-muted-foreground',
    iconClass: 'text-muted-foreground',
  },
} as const;

// 헬퍼 함수
export function getEventIcon(type: EventType): LucideIcon {
  return EVENT_TYPE_CONFIG[type].icon;
}

export function getEventLabel(type: EventType): string {
  return EVENT_TYPE_CONFIG[type].label;
}

export function getStatusConfig(status: EventStatus) {
  return EVENT_STATUS_CONFIG[status];
}
