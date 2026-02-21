'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, type ReactNode } from 'react';
import { CalendarIcon, PlusIcon } from '@phosphor-icons/react';
import EmptyState from '@/components/common/EmptyState';
import {
  EventActionButtons,
  EventStatusBadge,
  MealCard,
  NutritionSummary,
} from '@/components/routine';
import MealAddDrawer, { type MealAddOption } from '@/components/routine/meal/MealAddDrawer';
import AddMealSheet from '@/components/routine/sheets/AddMealSheet';
import ImportUnitMealSheet from '@/components/routine/sheets/ImportUnitMealSheet';
import { getEventConfig } from '@/lib/config/theme';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import { useEventHeaderActions } from '@/hooks/routine/useEventHeaderActions';
import { useMealEvent, useUpdateRoutineEvent } from '@/hooks/routine';

interface MealContentProps {
  date: string;
  onHeaderAction?: (action: ReactNode) => void;
}

const MEAL_LABELS = ['아침', '점심', '저녁', '간식'] as const;
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function MealContent({ date, onHeaderAction }: MealContentProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();

  const {
    event,
    mealData,
    handleDelete,
    handleComplete,
    handleUncomplete,
    handleMealToggle,
    handleRemoveMeal,
    isUpdating,
    isCompleting,
    isUncompleting,
  } = useMealEvent(date);

  const formattedDate = formatKoreanDate(date, { weekday: true });
  const eventConfig = getEventConfig('meal');

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const updateEvent = useUpdateRoutineEvent();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);

  const enterEditMode = useCallback(() => {
    if (event) {
      setEditingTitle(event.title);
    }
    setIsEditMode(true);
  }, [event]);

  const exitEditMode = useCallback(() => {
    if (event) {
      const trimmed = editingTitle.trim();
      if (trimmed && trimmed !== event.title) {
        updateEvent.mutate({ id: event.id, data: { title: trimmed } });
      }
    }
    setIsEditMode(false);
    setEditingTitle('');
  }, [editingTitle, event, updateEvent]);

  const handleHeaderExit = useCallback(() => {
    exitEditMode();
  }, [exitEditMode]);

  useEventHeaderActions({
    event,
    isEditMode,
    onHeaderAction,
    onEnterEditMode: enterEditMode,
    onExitEditMode: handleHeaderExit,
    onDelete: handleDelete,
  });

  const handleAddOption = useCallback(
    (option: MealAddOption) => {
      setIsAddDrawerOpen(false);
      if (option === 'ai') {
        router.push('/routine/counselor');
      } else if (option === 'direct') {
        setIsAddSheetOpen(true);
      } else {
        setIsImportSheetOpen(true);
      }
    },
    [router],
  );

  const handleRemoveMealWithConfirm = useCallback(
    (mealIndex: number) => {
      const mealType = mealData?.meals[mealIndex]?.type;
      const typeIndex = mealType ? MEAL_TYPES.indexOf(mealType as (typeof MEAL_TYPES)[number]) : -1;
      const mealLabel = typeIndex >= 0 ? MEAL_LABELS[typeIndex] : '식사';

      confirm({
        title: `${mealLabel}을 삭제할까요?`,
        message: '삭제한 식사는 복구할 수 없습니다.',
        confirmText: '삭제',
        onConfirm: () => handleRemoveMeal(mealIndex),
      });
    },
    [confirm, handleRemoveMeal, mealData?.meals],
  );

  if (!event) {
    return (
      <>
        <div className="mt-8">
          <EmptyState
            icon={CalendarIcon}
            message={`${formattedDate}에 예정된 식단이 없습니다.`}
            showIconBackground
            size="lg"
          />
          <div className="mt-6 px-4">
            <button
              type="button"
              onClick={() => setIsAddDrawerOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-primary text-primary-foreground"
            >
              <PlusIcon size={18} weight="bold" />
              식단 추가하기
            </button>
          </div>
        </div>

        <MealAddDrawer
          isOpen={isAddDrawerOpen}
          onClose={() => setIsAddDrawerOpen(false)}
          onSelect={handleAddOption}
        />
        <AddMealSheet
          isOpen={isAddSheetOpen}
          onClose={() => setIsAddSheetOpen(false)}
          date={date}
        />
        <ImportUnitMealSheet
          isOpen={isImportSheetOpen}
          onClose={() => setIsImportSheetOpen(false)}
          date={date}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-10">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <eventConfig.icon size={18} className={eventConfig.color} weight="fill" />
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
            <EventStatusBadge status={event.status} date={event.date} />
          </div>

          {isEditMode && (
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              className="w-full mt-3 text-lg font-semibold text-foreground bg-transparent border-b border-border focus:border-primary focus:outline-none pb-1"
              placeholder="식단 제목"
            />
          )}

          {!isEditMode && event.rationale && (
            <p className="text-sm text-muted-foreground mt-2">{event.rationale}</p>
          )}
        </div>

        {mealData && <NutritionSummary data={mealData} />}

        {mealData && mealData.meals.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                식사 목록 ({mealData.meals.length}개)
              </h2>
              {!isEditMode && event.status === 'scheduled' && mealData.meals.some((meal) => meal.completed) && (
                <p className="text-xs text-muted-foreground">
                  {mealData.meals.filter((meal) => meal.completed).length}/{mealData.meals.length}개 완료
                </p>
              )}
            </div>

            <div className="space-y-3">
              {mealData.meals.map((meal, index) => (
                <MealCard
                  key={`${meal.type}-${index}`}
                  meal={meal}
                  isCompleted={event.status === 'completed'}
                  showCompletionToggle={!isEditMode && event.status === 'scheduled'}
                  onToggleComplete={() => handleMealToggle(index)}
                  showDeleteButton={isEditMode && mealData.meals.length > 1}
                  onDelete={() => handleRemoveMealWithConfirm(index)}
                />
              ))}
            </div>

            {event.status === 'scheduled' && !isEditMode && (
              <button
                type="button"
                onClick={() => setIsAddDrawerOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground"
              >
                <PlusIcon size={16} weight="bold" />
                식사 추가
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-xl p-6 text-center">
              <p className="text-muted-foreground">상세 식단 정보가 없습니다.</p>
            </div>
            {event.status === 'scheduled' && (
              <button
                type="button"
                onClick={() => setIsAddDrawerOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground"
              >
                <PlusIcon size={16} weight="bold" />
                식사 추가
              </button>
            )}
          </div>
        )}

        {mealData?.notes && (
          <div className="bg-muted/20 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">메모</h3>
            <p className="text-foreground">{mealData.notes}</p>
          </div>
        )}
      </div>

      {!isEditMode && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-safe bg-background border-t border-border">
          <EventActionButtons
            status={event.status}
            date={event.date}
            onComplete={handleComplete}
            onUncomplete={handleUncomplete}
            isLoading={isCompleting || isUncompleting || isUpdating}
          />
        </div>
      )}

      <MealAddDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onSelect={handleAddOption}
        isAppending
      />

      <AddMealSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        date={date}
        existingEvent={event}
      />

      <ImportUnitMealSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
        date={date}
      />
    </>
  );
}
