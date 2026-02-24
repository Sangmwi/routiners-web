'use client';

import { getDisplayStatus, EVENT_STATUS } from '@/lib/config/theme';
import type { EventStatus } from '@/lib/types/routine';

interface StatusPillProps {
  status: EventStatus;
  date: string;
}

/**
 * 이벤트 상태 텍스트 (완료 / 미완 / 예정)
 */
export default function StatusPill({ status, date }: StatusPillProps) {
  const displayStatus = getDisplayStatus(status, date);
  const config = EVENT_STATUS[displayStatus];

  return (
    <span className={`text-xs font-medium ${config.statusClass}`}>
      {config.label}
    </span>
  );
}
