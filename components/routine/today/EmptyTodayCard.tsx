'use client';

import { useRouter } from 'next/navigation';
import { BarbellIcon, BowlFoodIcon, CaretRightIcon } from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils/dateHelpers';
import { useWorkoutAddFlow } from '@/hooks/routine/useWorkoutAddFlow';
import { useMealAddFlow } from '@/hooks/routine/useMealAddFlow';

interface EmptyTodayCardProps {
  type: 'workout' | 'meal';
}

const CONFIG = {
  workout: {
    icon: BarbellIcon,
    title: '오늘 운동 없음',
    subtitle: '기록을 추가해보세요',
  },
  meal: {
    icon: BowlFoodIcon,
    title: '오늘 식단 없음',
    subtitle: '식단을 기록해보세요',
  },
} as const;

/**
 * 빈 상태 표시
 * - 탭하면 추가 방법 선택 드로어 열림
 * - TodayEventCard와 일관된 스타일
 * - 운동: AI 상담 / 직접 추가
 * - 식단: 부대 식단 불러오기 / AI 추천 / 직접 입력 (MealAddSheet)
 */
export function EmptyTodayCard({ type }: EmptyTodayCardProps) {
  const router = useRouter();
  const today = formatDate(new Date());
  const { icon: Icon, title, subtitle } = CONFIG[type];

  const workoutAdd = useWorkoutAddFlow({
    date: today,
    onCreated: () => router.push(`/routine/workout/${today}`),
  });
  const mealAdd = useMealAddFlow({
    date: today,
    onCreated: () => router.push(`/routine/meal/${today}`),
  });

  const handleCardClick = type === 'workout' ? workoutAdd.open : mealAdd.open;

  return (
    <>
      <button
        type="button"
        onClick={handleCardClick}
        className="w-full flex items-center gap-4 px-2 py-5 active:bg-surface-secondary transition-colors rounded-xl"
      >
        <Icon size={32} weight="duotone" className="text-hint-strong shrink-0" />
        <div className="flex-1 min-w-0 text-left">
          <h3 className="text-base font-medium text-muted-foreground">{title}</h3>
          <p className="text-sm text-hint-strong mt-1">{subtitle}</p>
        </div>
        <CaretRightIcon size={20} weight="bold" className="text-hint shrink-0" />
      </button>

      {type === 'workout' ? workoutAdd.element : mealAdd.element}
    </>
  );
}

export default EmptyTodayCard;
