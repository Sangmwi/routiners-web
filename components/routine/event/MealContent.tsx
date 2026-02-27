'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import { EMPTY_STATE } from '@/lib/config/theme';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import EmptyState from '@/components/common/EmptyState';
import {
  EventActionButtons,
  EventStatusBadge,
  MealCard,
  NutritionSummary,
} from '@/components/routine';
import { useMealAddFlow } from '@/hooks/routine';
import { getEventConfig } from '@/lib/config/theme';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import { useEventHeaderActions } from '@/hooks/routine/useEventHeaderActions';
import { useMealEvent, useUpdateRoutineEvent } from '@/hooks/routine';

interface MealContentProps {
  date: string;
  onTitleChange?: (title: string) => void;
  onHeaderAction?: (action: ReactNode) => void;
}

const MEAL_LABELS = ['아침', '점심', '저녁', '간식'] as const;
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function MealContent({ date, onTitleChange, onHeaderAction }: MealContentProps) {
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

  const mealAdd = useMealAddFlow({ date, existingEvent: event ?? undefined });

  const enterEditMode = () => {
    if (event) {
      setEditingTitle(event.title);
    }
    setIsEditMode(true);
  };

  const exitEditMode = () => {
    if (event) {
      const trimmed = editingTitle.trim();
      if (trimmed && trimmed !== event.title) {
        updateEvent.mutate({ id: event.id, data: { title: trimmed } });
      }
    }
    setIsEditMode(false);
    setEditingTitle('');
  };

  const handleHeaderExit = () => {
    exitEditMode();
  };

  useEventHeaderActions({
    event,
    isEditMode,
    onHeaderAction,
    onEnterEditMode: enterEditMode,
    onExitEditMode: handleHeaderExit,
    onDelete: handleDelete,
  });

  useEffect(() => {
    if (event?.title && onTitleChange) {
      onTitleChange(event.title);
    }
  }, [event?.title, onTitleChange]);

  const handleRemoveMealWithConfirm = (mealIndex: number) => {
      const mealType = mealData?.meals[mealIndex]?.type;
      const typeIndex = mealType ? MEAL_TYPES.indexOf(mealType as (typeof MEAL_TYPES)[number]) : -1;
      const mealLabel = typeIndex >= 0 ? MEAL_LABELS[typeIndex] : '식사';

      confirm({
        title: `${mealLabel}을 삭제할까요?`,
        message: '삭제한 식사는 복구할 수 없습니다.',
        confirmText: '삭제',
        onConfirm: () => handleRemoveMeal(mealIndex),
      });
    };

  if (!event) {
    return (
      <>
        <div className="mt-8">
          <EmptyState
            {...EMPTY_STATE.routine.noEvent}
            message={`${formattedDate}에 예정된 식단이 없어요`}
            size="lg"
          />
          <div className="mt-6 px-4">
            <Button
              variant="primary"
              fullWidth
              onClick={mealAdd.open}
              className="shadow-none hover:shadow-none"
            >
              <PlusIcon size={18} weight="bold" />
              식단 추가하기
            </Button>
          </div>
        </div>

        {mealAdd.element}
      </>
    );
  }

  return (
    <>
      <div className="space-y-10 pb-footer-clearance">
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
                onClick={mealAdd.open}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground"
              >
                <PlusIcon size={16} weight="bold" />
                식사 추가
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <EmptyState {...EMPTY_STATE.meal.noDetail} />
            {event.status === 'scheduled' && (
              <button
                type="button"
                onClick={mealAdd.open}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground"
              >
                <PlusIcon size={16} weight="bold" />
                식사 추가
              </button>
            )}
          </div>
        )}

        {mealData?.notes && (
          <div className="bg-surface-secondary rounded-2xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">메모</h3>
            <p className="text-foreground">{mealData.notes}</p>
          </div>
        )}
      </div>

      {!isEditMode && (
        <GradientFooter variant="page" wrapperClassName="animate-float-up">
          <EventActionButtons
            status={event.status}
            date={event.date}
            onComplete={handleComplete}
            onUncomplete={handleUncomplete}
            isLoading={isCompleting || isUncompleting}
          />
        </GradientFooter>
      )}

      {mealAdd.element}
    </>
  );
}
