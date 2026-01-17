'use client';

import { CheckIcon, ClockIcon, SkipForwardIcon } from '@phosphor-icons/react';
import { EVENT_STATUS } from '@/lib/config/theme';
import type { EventStatus } from '@/lib/types/routine';

interface EventStatusBadgeProps {
  status: EventStatus;
  size?: 'sm' | 'md';
}

/**
 * 이벤트 상태 뱃지
 */
export default function EventStatusBadge({
  status,
  size = 'md',
}: EventStatusBadgeProps) {
  const config = EVENT_STATUS[status];
  const Icon = config.icon;

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium text-white ${config.badgeClass} ${sizeClass}`}
    >
      <Icon size={size === 'sm' ? 12 : 16} weight="bold" />
      {config.label}
    </span>
  );
}
