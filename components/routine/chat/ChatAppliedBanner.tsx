'use client';

import { CheckCircle, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ChatAppliedBannerProps {
  /** 타입: workout (루틴) 또는 meal (식단) */
  type: 'workout' | 'meal';
  /** 생성된 이벤트 수 */
  eventsCreated: number;
  /** 시작 날짜 */
  startDate: string;
}

interface TypeConfig {
  icon: LucideIcon;
  iconBg: string;
  cardBg: string;
  border: string;
  textColor: string;
  subTextColor: string;
  title: string;
  unit: string;
}

const TYPE_CONFIG: Record<'workout' | 'meal', TypeConfig> = {
  workout: {
    icon: CheckCircle,
    iconBg: 'bg-workout text-workout-foreground',
    cardBg: 'bg-workout/5',
    border: 'border-workout/20',
    textColor: 'text-workout',
    subTextColor: 'text-workout/70',
    title: '루틴이 적용되었습니다!',
    unit: '개의 운동이',
  },
  meal: {
    icon: Utensils,
    iconBg: 'bg-meal text-meal-foreground',
    cardBg: 'bg-meal/5',
    border: 'border-meal/20',
    textColor: 'text-meal',
    subTextColor: 'text-meal/70',
    title: '식단이 적용되었습니다!',
    unit: '일 분의 식단이',
  },
};

/**
 * 적용 완료 배너 컴포넌트
 *
 * 루틴/식단 적용 완료 메시지를 표시
 */
export function ChatAppliedBanner({
  type,
  eventsCreated,
  startDate,
}: ChatAppliedBannerProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className="flex gap-3 items-start">
      <div
        className={`shrink-0 w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div
        className={`${config.cardBg} border ${config.border} rounded-2xl rounded-tl-md px-4 py-3`}
      >
        <p className={`text-sm ${config.textColor} font-medium`}>
          {config.title}
        </p>
        <p className={`text-xs ${config.subTextColor} mt-1`}>
          {eventsCreated}
          {config.unit} {startDate}부터 시작됩니다.
        </p>
      </div>
    </div>
  );
}
