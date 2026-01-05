'use client';

import { Check, Clock, SkipForward } from 'lucide-react';

interface EventStatusBadgeProps {
  status: 'scheduled' | 'completed' | 'skipped';
  size?: 'sm' | 'md';
}

const STATUS_CONFIG = {
  scheduled: {
    label: '예정',
    icon: Clock,
    bgColor: 'bg-amber-500',
  },
  completed: {
    label: '완료',
    icon: Check,
    bgColor: 'bg-primary',
  },
  skipped: {
    label: '건너뜀',
    icon: SkipForward,
    bgColor: 'bg-muted-foreground',
  },
};

/**
 * 이벤트 상태 뱃지
 */
export default function EventStatusBadge({
  status,
  size = 'md',
}: EventStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium text-white ${config.bgColor} ${sizeClass}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
}
