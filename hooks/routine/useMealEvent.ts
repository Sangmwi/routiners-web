'use client';

import { useConfirmDialog } from '@/lib/stores/modalStore';
import { useShowError } from '@/lib/stores/errorStore';
import { isMealData } from '@/lib/types/guards';
import { useRoutineEventByDateSuspense } from './queries';
import { useCompleteRoutineEvent, useUpdateMealData } from './mutations';
import { useRoutineEventActions } from './useRoutineEventActions';
import type { Meal, MealData } from '@/lib/types/meal';

interface MealDataUpdateOptions {
  errorMessage: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export function useMealEvent(date: string) {
  const showError = useShowError();
  const confirm = useConfirmDialog();

  const { data: event } = useRoutineEventByDateSuspense(date, 'meal');
  const mealData: MealData | null =
    event && isMealData(event.data) ? event.data : null;

  const completeEvent = useCompleteRoutineEvent();
  const updateMeal = useUpdateMealData();
  const { deleteEventAndGoBack, uncompleteEvent, isUncompleting } = useRoutineEventActions();

  const mutateMealData = (
    nextMealData: MealData,
    { errorMessage, onSuccess, onError }: MealDataUpdateOptions,
  ) => {
    if (!event) return;

    updateMeal.mutate(
      {
        id: event.id,
        data: nextMealData,
        date: event.date,
        type: event.type,
      },
      {
        onSuccess,
        onError: () => {
          showError(errorMessage);
          onError?.();
        },
      },
    );
  };

  const handleDelete = () => {
    if (!event) return;

    confirm({
      title: '루틴을 삭제하시겠어요?',
      message: '삭제하면 되돌릴 수 없어요.',
      confirmText: '삭제',
      onConfirm: () =>
        deleteEventAndGoBack(event, {
          errorMessage: '식단 삭제에 실패했어요.',
        }),
    });
  };

  const handleComplete = () => {
    if (!event || !mealData) return;

    const updatedMeals = mealData.meals.map((meal) => ({ ...meal, completed: true }));
    const nextMealData: MealData = { ...mealData, meals: updatedMeals };

    mutateMealData(nextMealData, {
      errorMessage: '식단 완료 처리에 실패했어요.',
      onSuccess: () => {
        completeEvent.mutate(event.id, {
          onError: () => showError('식단 완료 처리에 실패했어요.'),
        });
      },
    });
  };

  const handleMealToggle = (mealIndex: number) => {
    if (!event || !mealData || event.status !== 'scheduled') return;

    const updatedMeals = mealData.meals.map((meal, index) =>
      index === mealIndex ? { ...meal, completed: !meal.completed } : meal,
    );
    const nextMealData: MealData = { ...mealData, meals: updatedMeals };
    const allCompleted = updatedMeals.every((meal) => meal.completed);

    mutateMealData(nextMealData, {
      errorMessage: '식단 저장에 실패했어요.',
      onSuccess: () => {
        if (!allCompleted) return;
        completeEvent.mutate(event.id, {
          onError: () => showError('식단 완료 처리에 실패했어요.'),
        });
      },
    });
  };

  const handleRemoveMeal = (mealIndex: number) => {
    if (!event || !mealData) return;

    const updatedMeals = mealData.meals.filter((_, index) => index !== mealIndex);
    const updatedCalories = updatedMeals.reduce(
      (sum, meal) => sum + (meal.totalCalories ?? 0),
      0,
    );

    const nextMealData: MealData = {
      ...mealData,
      meals: updatedMeals,
      estimatedTotalCalories: updatedCalories || mealData.estimatedTotalCalories,
    };

    mutateMealData(nextMealData, {
      errorMessage: '식사 삭제에 실패했어요.',
    });
  };

  const handleAddMeal = (newMeal: Meal) => {
    if (!event || !mealData) return;

    const updatedMeals = [...mealData.meals, newMeal];
    const updatedCalories = updatedMeals.reduce(
      (sum, meal) => sum + (meal.totalCalories ?? 0),
      0,
    );

    const nextMealData: MealData = {
      ...mealData,
      meals: updatedMeals,
      estimatedTotalCalories: updatedCalories,
    };

    mutateMealData(nextMealData, {
      errorMessage: '식사 추가에 실패했어요.',
    });
  };

  const handleUncomplete = () => {
    if (!event || event.status !== 'completed') return;

    confirm({
      title: '완료를 되돌리시겠어요?',
      message: '루틴이 미완료 상태로 돌아가요.',
      confirmText: '되돌리기',
      onConfirm: () =>
        uncompleteEvent(event, {
          errorMessage: '되돌리기에 실패했어요.',
        }),
    });
  };

  return {
    event,
    mealData,
    handleDelete,
    handleComplete,
    handleUncomplete,
    handleMealToggle,
    handleRemoveMeal,
    handleAddMeal,
    isUpdating: updateMeal.isPending,
    isCompleting: completeEvent.isPending,
    isUncompleting,
  };
}
