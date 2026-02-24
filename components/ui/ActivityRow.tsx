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
  /** 'large' 모드: 루틴 페이지에서 확대된 크기로 표시 */
  size?: 'default' | 'large';
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
  size = 'default',
}: ActivityRowProps) {
  const isLarge = size === 'large';

  return (
    <AppLink href={href} className={`flex items-center w-full text-left ${isLarge ? 'gap-2' : 'gap-1.5'}`}>
      <Icon size={isLarge ? 18 : 15} weight="fill" className="text-primary shrink-0" />
      <span className={`font-medium text-foreground truncate ${isLarge ? 'text-sm' : 'text-xs'}`}>
        {label}
      </span>
      {meta && (
        <span className={`text-muted-foreground shrink-0 ${isLarge ? 'text-sm' : 'text-xs'}`}>
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
