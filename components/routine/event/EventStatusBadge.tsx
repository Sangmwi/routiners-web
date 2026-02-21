'use client';

import { EVENT_STATUS, getDisplayStatus } from '@/lib/config/theme';
import type { EventStatus } from '@/lib/types/routine';

interface EventStatusBadgeProps {
  status: EventStatus;
  date: string;
  size?: 'sm' | 'md';
}

/**
 * 이벤트 상태 뱃지
 */
export default function EventStatusBadge({
  status,
  date,
  size = 'md',
}: EventStatusBadgeProps) {
  const displayStatus = getDisplayStatus(status, date);
  const config = EVENT_STATUS[displayStatus];
  const Icon = config.icon;

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium shrink-0 ${config.badgeClass} ${sizeClass}`}
    >
      <Icon size={12} weight="bold" />
      {config.label}
    </span>
  );
}
