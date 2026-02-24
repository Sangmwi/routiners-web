'use client';

import { getDisplayStatus, EVENT_STATUS } from '@/lib/config/theme';
import type { EventStatus } from '@/lib/types/routine';

interface StatusPillProps {
  status: EventStatus;
  date: string;
}

/**
 * 이벤트 상태 표시 (완료 / 미완료 / 예정)
 *
 * - completed → ✓ 완료 (primary)
 * - incomplete → ✗ 미완료 (muted)
 * - scheduled → ⏱ 예정 (scheduled)
 */
export default function StatusPill({ status, date }: StatusPillProps) {
  const displayStatus = getDisplayStatus(status, date);
  const config = EVENT_STATUS[displayStatus];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${config.iconClass}`}>
      <Icon size={14} weight={config.weight} />
      {config.label}
    </span>
  );
}
