'use client';

import AppLink from '@/components/common/AppLink';
import { BarbellIcon, ForkKnifeIcon, CaretRightIcon } from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils/dateHelpers';

interface EmptyTodayCardProps {
  type: 'workout' | 'meal';
}

const CONFIG = {
  workout: {
    icon: BarbellIcon,
    href: (date: string) => `/routine/workout/${date}`,
    title: '오늘 운동 없음',
    subtitle: '기록을 추가해보세요',
  },
  meal: {
    icon: ForkKnifeIcon,
    href: (date: string) => `/routine/meal/${date}`,
    title: '오늘 식단 없음',
    subtitle: '식단을 기록해보세요',
  },
} as const;

/**
 * 빈 상태 표시
 * - TodayEventCard와 일관된 스타일
 * - 운동/식단 모두 클릭 가능 (각 상세 페이지로 이동)
 */
export function EmptyTodayCard({ type }: EmptyTodayCardProps) {
  const today = formatDate(new Date());
  const { icon: Icon, href, title, subtitle } = CONFIG[type];

  return (
    <AppLink
      href={href(today)}
      className="w-full flex items-center gap-4 px-2 py-5 active:bg-muted/20 transition-colors rounded-xl"
    >
      <Icon size={32} weight="duotone" className="text-muted-foreground/60 shrink-0" />
      <div className="flex-1 min-w-0 text-left">
        <h3 className="text-base font-medium text-muted-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground/60 mt-1">{subtitle}</p>
      </div>
      <CaretRightIcon size={20} weight="bold" className="text-muted-foreground/50 shrink-0" />
    </AppLink>
  );
}

export default EmptyTodayCard;
