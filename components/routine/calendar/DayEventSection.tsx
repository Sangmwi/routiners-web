'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DayEventCard } from '@/components/routine';
import { useRoutineEventByDateSuspense, useDeleteRoutineEvent } from '@/hooks/routine';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import type { EventType } from '@/lib/types/routine';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import { BarbellIcon, BowlFoodIcon, PlusIcon } from '@phosphor-icons/react';
import AddWorkoutSheet from '@/components/routine/sheets/AddWorkoutSheet';
import AddMealSheet from '@/components/routine/sheets/AddMealSheet';
import ImportUnitMealSheet from '@/components/routine/sheets/ImportUnitMealSheet';
import MealAddDrawer, { type MealAddOption } from '@/components/routine/meal/MealAddDrawer';
import WorkoutAddDrawer, { type WorkoutAddOption } from '@/components/routine/workout/WorkoutAddDrawer';

type FilterType = EventType | 'all';

interface DayEventSectionProps {
  date: string;
  filterType: FilterType;
}

/**
 * 선택된 날짜의 이벤트 섹션 (Suspense 내부)
 *
 * - 운동/식단 독립 섹션으로 표시
 * - 운동 빈 상태: AI 상담 / 직접 추가
 * - 식단 빈 상태: 부대 식단 불러오기 / AI 추천 / 직접 입력 (MealAddDrawer)
 */
export default function DayEventSection({ date, filterType }: DayEventSectionProps) {
  const router = useRouter();

  const { data: workoutEvent } = useRoutineEventByDateSuspense(date, 'workout');
  const { data: mealEvent } = useRoutineEventByDateSuspense(date, 'meal');

  const deleteEvent = useDeleteRoutineEvent();
  const confirm = useConfirmDialog();

  const handleLongPressDelete = (eventId: string, eventDate: string, eventType: 'workout' | 'meal') => {
    confirm({
      title: '루틴을 삭제하시겠어요?',
      message: '삭제하면 되돌릴 수 없어요.',
      confirmText: '삭제',
      onConfirm: async () => {
        await deleteEvent.mutateAsync({
          id: eventId,
          date: eventDate,
          type: eventType,
        });
      },
    });
  };

  // 운동 드로어 (WorkoutAddDrawer)
  const [isWorkoutDrawerOpen, setIsWorkoutDrawerOpen] = useState(false);
  const [activeWorkoutSheet, setActiveWorkoutSheet] = useState(false);

  const handleWorkoutOption = (option: WorkoutAddOption) => {
    setIsWorkoutDrawerOpen(false);
    if (option === 'ai') {
      router.push('/routine/counselor');
    } else {
      setActiveWorkoutSheet(true);
    }
  };

  // 식단 드로어 (MealAddDrawer)
  const [isMealDrawerOpen, setIsMealDrawerOpen] = useState(false);
  const [isMealSheetOpen, setIsMealSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);

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

  const handleCreated = (type: 'workout' | 'meal') => {
    router.push(`/routine/${type}/${date}`);
  };

  const showWorkout = filterType === 'all' || filterType === 'workout';
  const showMeal = filterType === 'all' || filterType === 'meal';

  return (
    <div>
      <h2 className="text-sm font-medium text-muted-foreground mb-3">
        {formatKoreanDate(date, {
          year: false,
          weekday: true,
          weekdayFormat: 'short',
        })}{' '}
        루틴
      </h2>

      <div>
        {showWorkout && (
          workoutEvent ? (
            <DayEventCard event={workoutEvent} date={date} onLongPress={() => handleLongPressDelete(workoutEvent.id, workoutEvent.date, 'workout')} />
          ) : (
            <button
              type="button"
              onClick={() => setIsWorkoutDrawerOpen(true)}
              className="w-full flex items-center gap-4 px-2 py-5 active:bg-surface-secondary transition-colors rounded-xl"
            >
              <BarbellIcon size={28} weight="duotone" className="text-hint-faint shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-hint">예정된 운동이 없어요</p>
              </div>
              <div className="flex items-center gap-1 text-primary shrink-0">
                <PlusIcon size={16} weight="bold" />
                <span className="text-sm font-medium">추가</span>
              </div>
            </button>
          )
        )}

        {showWorkout && showMeal && (
          <div className="mx-2 border-t border-edge-faint" />
        )}

        {showMeal && (
          mealEvent ? (
            <DayEventCard event={mealEvent} date={date} onLongPress={() => handleLongPressDelete(mealEvent.id, mealEvent.date, 'meal')} />
          ) : (
            <button
              type="button"
              onClick={() => setIsMealDrawerOpen(true)}
              className="w-full flex items-center gap-4 px-2 py-5 active:bg-surface-secondary transition-colors rounded-xl"
            >
              <BowlFoodIcon size={28} weight="duotone" className="text-hint-faint shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-hint">예정된 식단이 없어요</p>
              </div>
              <div className="flex items-center gap-1 text-primary shrink-0">
                <PlusIcon size={16} weight="bold" />
                <span className="text-sm font-medium">추가</span>
              </div>
            </button>
          )
        )}
      </div>

      {/* 운동: AI / 직접 추가 드로어 */}
      <WorkoutAddDrawer
        isOpen={isWorkoutDrawerOpen}
        onClose={() => setIsWorkoutDrawerOpen(false)}
        onSelect={handleWorkoutOption}
      />

      {/* 식단: 부대 식단 / AI / 직접 입력 드로어 */}
      <MealAddDrawer
        isOpen={isMealDrawerOpen}
        onClose={() => setIsMealDrawerOpen(false)}
        onSelect={handleMealOption}
      />

      {/* 시트 */}
      <AddWorkoutSheet
        isOpen={activeWorkoutSheet}
        onClose={() => setActiveWorkoutSheet(false)}
        date={date}
        onCreated={() => handleCreated('workout')}
      />
      <AddMealSheet
        isOpen={isMealSheetOpen}
        onClose={() => setIsMealSheetOpen(false)}
        date={date}
        onCreated={() => handleCreated('meal')}
      />
      <ImportUnitMealSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
        date={date}
        onCreated={() => handleCreated('meal')}
      />
    </div>
  );
}
