'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useShowError } from '@/lib/stores/errorStore';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import { queryKeys } from '@/lib/constants/queryKeys';
import { isMealData } from '@/lib/types/guards';
import { useRoutineEventByDateSuspense } from './queries';
import {
  useCompleteRoutineEvent,
  useUpdateRoutineEvent,
  useDeleteRoutineEvent,
  useUpdateMealData,
} from './mutations';
import type { Meal, MealData } from '@/lib/types/meal';
import type { RoutineEvent } from '@/lib/types/routine';

/**
 * 식단 이벤트 데이터 + 뮤테이션 로직 훅
 *
 * useWorkoutEvent와 동일한 구조로 MealContent에서 비즈니스 로직을 분리.
 * 컴포넌트가 UI 렌더링에만 집중할 수 있도록 한다.
 */
export function useMealEvent(date: string) {
  const router = useRouter();
  const showError = useShowError();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();

  // 데이터 조회
  const { data: event } = useRoutineEventByDateSuspense(date, 'meal');

  // 뮤테이션
  const completeEvent = useCompleteRoutineEvent();
  const updateEvent = useUpdateRoutineEvent();
  const updateMeal = useUpdateMealData();
  const deleteEvent = useDeleteRoutineEvent();

  // 식단 데이터 추출
  const mealData: MealData | null =
    event && isMealData(event.data) ? event.data : null;

  // ── 헬퍼: mealData를 업데이트하고 낙관적 캐시 반영 ──────────────────────
  const applyMealDataUpdate = (
    targetEvent: RoutineEvent,
    nextMealData: MealData,
    options?: {
      onSuccess?: () => void;
      onError?: () => void;
    }
  ) => {
    // 낙관적 캐시 업데이트 (즉시 UI 반영)
    const byDateKey = queryKeys.routineEvent.byDate(date, 'meal');
    queryClient.setQueryData(byDateKey, { ...targetEvent, data: nextMealData });

    updateMeal.mutate(
      { id: targetEvent.id, data: nextMealData, date: targetEvent.date, type: targetEvent.type },
      {
        onSuccess: options?.onSuccess,
        onError: () => {
          queryClient.setQueryData(byDateKey, targetEvent);
          showError(options?.onError ? '' : '저장에 실패했어요');
          options?.onError?.();
        },
      }
    );
  };

  // ── 전체 이벤트 삭제 ─────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!event) return;
    confirm({
      title: '루틴을 삭제하시겠어요?',
      message: '삭제하면 되돌릴 수 없어요.',
      confirmText: '삭제',
      onConfirm: async () => {
        await deleteEvent.mutateAsync({ id: event.id, date: event.date, type: event.type });
        router.back();
      },
    });
  };

  // ── 전체 완료 처리 (모든 끼니 completed → 이벤트 완료) ───────────────────
  const handleComplete = () => {
    if (!event || !mealData) return;

    const updatedMeals = mealData.meals.map((m) => ({ ...m, completed: true }));
    const updatedMealData: MealData = { ...mealData, meals: updatedMeals };

    updateMeal.mutate(
      { id: event.id, data: updatedMealData, date: event.date, type: event.type },
      {
        onSuccess: () => {
          completeEvent.mutate(event.id, {
            onError: () => showError('식단 완료에 실패했어요'),
          });
        },
        onError: () => showError('식단 완료에 실패했어요'),
      }
    );
  };

  // ── 개별 끼니 완료 토글 ───────────────────────────────────────────────────
  const handleMealToggle = (mealIndex: number) => {
    if (!event || !mealData || event.status !== 'scheduled') return;

    const updatedMeals = mealData.meals.map((meal, i) =>
      i === mealIndex ? { ...meal, completed: !meal.completed } : meal
    );
    const nextMealData: MealData = { ...mealData, meals: updatedMeals };
    const allCompleted = updatedMeals.every((m) => m.completed);

    applyMealDataUpdate(event, nextMealData, {
      onSuccess: () => {
        if (allCompleted) {
          completeEvent.mutate(event.id, {
            onError: () => showError('식단 완료 처리에 실패했어요'),
          });
        }
      },
    });
  };

  // ── 개별 끼니 삭제 (편집 모드) ────────────────────────────────────────────
  const handleRemoveMeal = (mealIndex: number) => {
    if (!event || !mealData) return;

    const updatedMeals = mealData.meals.filter((_, i) => i !== mealIndex);
    const updatedCalories = updatedMeals.reduce((sum, m) => sum + (m.totalCalories ?? 0), 0);
    const nextMealData: MealData = {
      ...mealData,
      meals: updatedMeals,
      estimatedTotalCalories: updatedCalories || mealData.estimatedTotalCalories,
    };

    applyMealDataUpdate(event, nextMealData, {
      onError: () => showError('식사 삭제에 실패했어요'),
    });
  };

  // ── 끼니 추가 (상세 페이지에서 직접 입력 후 append) ──────────────────────
  const handleAddMeal = (newMeal: Meal) => {
    if (!event || !mealData) return;

    const updatedMeals = [...mealData.meals, newMeal];
    const updatedCalories = updatedMeals.reduce((sum, m) => sum + (m.totalCalories ?? 0), 0);
    const nextMealData: MealData = {
      ...mealData,
      meals: updatedMeals,
      estimatedTotalCalories: updatedCalories,
    };

    applyMealDataUpdate(event, nextMealData, {
      onError: () => showError('식사 추가에 실패했어요'),
    });
  };

  // ── 완료 되돌리기 ─────────────────────────────────────────────────────────
  const handleUncomplete = () => {
    if (!event || event.status !== 'completed') return;
    confirm({
      title: '완료를 되돌리시겠어요?',
      message: '루틴이 미완료 상태로 돌아가요.',
      confirmText: '되돌리기',
      onConfirm: () => {
        updateEvent.mutate(
          { id: event.id, data: { status: 'scheduled' } },
          { onError: () => showError('되돌리기에 실패했어요') }
        );
      },
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
    isUncompleting: updateEvent.isPending,
  };
}
