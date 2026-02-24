'use client';

import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import AppLink from '@/components/common/AppLink';
import StatusPill from './StatusPill';
import type { EventStatus } from '@/lib/types/routine';

interface ActivityRowProps {
  icon: PhosphorIcon;
  label: string;
  meta?: string;
  href: string;
  status?: EventStatus;
  date?: string;
}

/**
 * 활동 행 (운동/식단 공통)
 *
 * [Icon] [Label] [Meta] [StatusPill]
 * - WeeklyProgressChart, UpcomingSection 등에서 공유
 */
export default function ActivityRow({
  icon: Icon,
  label,
  meta,
  href,
  status,
  date,
}: ActivityRowProps) {
  return (
    <AppLink href={href} className="flex items-center gap-1.5 w-full text-left">
      <Icon size={15} weight="fill" className="text-primary shrink-0" />
      <span className="text-xs font-medium text-foreground truncate">
        {label}
      </span>
      {meta && (
        <span className="text-xs text-muted-foreground shrink-0">
          {meta}
        </span>
      )}
      {status && date && (
        <span className="ml-auto shrink-0">
          <StatusPill status={status} date={date} />
        </span>
      )}
    </AppLink>
  );
}
