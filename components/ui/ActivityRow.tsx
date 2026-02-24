'use client';

import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import type { IconWeight } from '@/lib/config/theme/base';
import AppLink from '@/components/common/AppLink';
import StatusPill from './StatusPill';
import { getDisplayStatus, EVENT_STATUS, type DisplayStatus } from '@/lib/config/theme';
import type { EventStatus } from '@/lib/types/routine';
import { useLongPress } from '@/hooks/ui';

const SIZE_CONFIG = {
  default: { gap: 'gap-1.5', icon: 15, text: 'text-xs' },
  large: { gap: 'gap-2', icon: 18, text: 'text-sm' },
} as const;

const ROW_STYLE: Record<DisplayStatus | 'default', {
  iconClass: string;
  iconWeight: IconWeight;
  labelClass: string;
  metaClass: string;
}> = {
  scheduled: {
    iconClass: EVENT_STATUS.scheduled.eventIconClass,
    iconWeight: EVENT_STATUS.scheduled.eventIconWeight,
    labelClass: 'text-foreground',
    metaClass: 'text-muted-foreground',
  },
  completed: {
    iconClass: EVENT_STATUS.completed.eventIconClass,
    iconWeight: EVENT_STATUS.completed.eventIconWeight,
    labelClass: 'text-hint-strong',
    metaClass: 'text-hint',
  },
  incomplete: {
    iconClass: EVENT_STATUS.incomplete.eventIconClass,
    iconWeight: EVENT_STATUS.incomplete.eventIconWeight,
    labelClass: 'text-hint',
    metaClass: 'text-hint-faint',
  },
  default: {
    iconClass: 'text-muted-foreground',
    iconWeight: 'fill',
    labelClass: 'text-muted-foreground',
    metaClass: 'text-hint-strong',
  },
};

interface ActivityRowProps {
  icon: PhosphorIcon;
  label: string;
  meta?: string;
  href: string;
  status?: EventStatus;
  date?: string;
  /** 'large' 모드: 루틴 페이지에서 확대된 크기로 표시 */
  size?: 'default' | 'large';
  /** 롱프레스 콜백 (삭제 등) */
  onLongPress?: () => void;
}

/**
 * 활동 행 (운동/식단 공통)
 *
 * [Icon] [Label] [Meta] [StatusPill]
 * - WeeklySchedule 등에서 공유
 * - 상태(scheduled/completed/incomplete)에 따라 아이콘·라벨 색상 자동 분기
 */
export default function ActivityRow({
  icon: Icon,
  label,
  meta,
  href,
  status,
  date,
  size = 'default',
  onLongPress,
}: ActivityRowProps) {
  const { gap, icon: iconSize, text } = SIZE_CONFIG[size];
  const displayStatus = status && date ? getDisplayStatus(status, date) : null;
  const style = ROW_STYLE[displayStatus ?? 'default'];
  const longPressHandlers = useLongPress(onLongPress ?? (() => {}));
  const handlers = onLongPress ? longPressHandlers : {};

  return (
    <AppLink href={href} className={`flex px-2 py-3 rounded-xl items-center w-full text-left active:bg-surface-secondary [.is-today_&]:active:bg-background/20 ${gap}`} {...handlers}>
      <Icon size={iconSize} weight={style.iconWeight} className={`${style.iconClass} shrink-0`} />
      <span className={`font-medium truncate ${style.labelClass} ${text}`}>
        {label}
      </span>
      {meta && (
        <span className={`shrink-0 ${style.metaClass} ${text}`}>
          {meta}
        </span>
      )}
      {status && date && (
        <span className="flex items-center ml-auto shrink-0 pr-2">
          <StatusPill status={status} date={date} />
        </span>
      )}
    </AppLink>
  );
}
