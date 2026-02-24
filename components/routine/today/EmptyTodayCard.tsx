'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarbellIcon, BowlFoodIcon, CaretRightIcon } from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils/dateHelpers';
import AddWorkoutSheet from '@/components/routine/sheets/AddWorkoutSheet';
import AddMealSheet from '@/components/routine/sheets/AddMealSheet';
import ImportUnitMealSheet from '@/components/routine/sheets/ImportUnitMealSheet';
import MealAddDrawer, { type MealAddOption } from '@/components/routine/meal/MealAddDrawer';
import WorkoutAddDrawer, { type WorkoutAddOption } from '@/components/routine/workout/WorkoutAddDrawer';

interface EmptyTodayCardProps {
  type: 'workout' | 'meal';
}

const CONFIG = {
  workout: {
    icon: BarbellIcon,
    title: '오늘 운동 없음',
    subtitle: '기록을 추가해보세요',
    aiLabel: 'AI 상담에게 맡기기',
    addLabel: '운동 직접 추가',
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
 * - 식단: 부대 식단 불러오기 / AI 추천 / 직접 입력 (MealAddDrawer)
 */
export function EmptyTodayCard({ type }: EmptyTodayCardProps) {
  const router = useRouter();
  const today = formatDate(new Date());
  const { icon: Icon, title, subtitle } = CONFIG[type];

  // 운동용 드로어 (WorkoutAddDrawer)
  const [isWorkoutDrawerOpen, setIsWorkoutDrawerOpen] = useState(false);
  const [isWorkoutSheetOpen, setIsWorkoutSheetOpen] = useState(false);

  // 식단용 드로어 (MealAddDrawer)
  const [isMealDrawerOpen, setIsMealDrawerOpen] = useState(false);
  const [isMealSheetOpen, setIsMealSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);

  const handleCardClick = () => {
    if (type === 'workout') {
      setIsWorkoutDrawerOpen(true);
    } else {
      setIsMealDrawerOpen(true);
    }
  };

  // 운동 드로어 핸들러
  const handleWorkoutOption = (option: WorkoutAddOption) => {
    setIsWorkoutDrawerOpen(false);
    if (option === 'ai') {
      router.push('/routine/counselor');
    } else {
      setIsWorkoutSheetOpen(true);
    }
  };

  // 식단 드로어 핸들러
  const handleMealOption = (option: MealAddOption) => {
    setIsMealDrawerOpen(false);
    if (option === 'ai') {
      router.push('/routine/counselor');
    } else if (option === 'direct') {
      setIsMealSheetOpen(true);
    } else {
      setIsImportSheetOpen(true);
    }
  };

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

      {/* 운동: AI / 직접 추가 드로어 */}
      {type === 'workout' && (
        <WorkoutAddDrawer
          isOpen={isWorkoutDrawerOpen}
          onClose={() => setIsWorkoutDrawerOpen(false)}
          onSelect={handleWorkoutOption}
        />
      )}

      {/* 식단: 부대 식단 / AI / 직접 입력 드로어 */}
      {type === 'meal' && (
        <MealAddDrawer
          isOpen={isMealDrawerOpen}
          onClose={() => setIsMealDrawerOpen(false)}
          onSelect={handleMealOption}
        />
      )}

      {/* 직접 추가 시트 */}
      {type === 'workout' ? (
        <AddWorkoutSheet
          isOpen={isWorkoutSheetOpen}
          onClose={() => setIsWorkoutSheetOpen(false)}
          date={today}
          onCreated={() => router.push(`/routine/workout/${today}`)}
        />
      ) : (
        <>
          <AddMealSheet
            isOpen={isMealSheetOpen}
            onClose={() => setIsMealSheetOpen(false)}
            date={today}
            onCreated={() => router.push(`/routine/meal/${today}`)}
          />
          <ImportUnitMealSheet
            isOpen={isImportSheetOpen}
            onClose={() => setIsImportSheetOpen(false)}
            date={today}
            onCreated={() => router.push(`/routine/meal/${today}`)}
          />
        </>
      )}
    </>
  );
}

export default EmptyTodayCard;
