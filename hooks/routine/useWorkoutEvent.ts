'use client';

import { useRouter } from 'next/navigation';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import { useShowError } from '@/lib/stores/errorStore';
import { isWorkoutData } from '@/lib/types/guards';
import { useRoutineEventByDateSuspense } from './queries';
import { useCompleteRoutineEvent, useUpdateWorkoutData } from './mutations';
import { clearPersistedTimer } from './useWorkoutSession';
import { useRoutineEventActions } from './useRoutineEventActions';
import type { WorkoutData, WorkoutSet } from '@/lib/types/routine';

export function useWorkoutEvent(date: string) {
  const router = useRouter();
  const showError = useShowError();
  const confirm = useConfirmDialog();

  const { data: event } = useRoutineEventByDateSuspense(date, 'workout');
  const workoutData: WorkoutData | null =
    event && isWorkoutData(event.data) ? event.data : null;

  const completeEvent = useCompleteRoutineEvent();
  const updateWorkout = useUpdateWorkoutData();
  const { deleteEventAndGoBack, uncompleteEvent, isUncompleting } = useRoutineEventActions();

  const handleDelete = () => {
    if (!event) return;

    confirm({
      title: '루틴을 삭제하시겠어요?',
      message: '삭제하면 되돌릴 수 없어요.',
      confirmText: '삭제',
      onConfirm: () =>
        deleteEventAndGoBack(event, {
          errorMessage: '운동 삭제에 실패했어요.',
        }),
    });
  };

  const handleComplete = () => {
    if (!event) return;

    completeEvent.mutate(event.id, {
      onSuccess: () => {
        clearPersistedTimer();
        router.back();
      },
      onError: () => showError('운동 완료에 실패했어요.'),
    });
  };

  const handleSetsChange = (exerciseId: string, sets: WorkoutSet[]) => {
    if (!event || !workoutData) return;

    const updatedData: WorkoutData = {
      ...workoutData,
      exercises: workoutData.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, sets } : exercise,
      ),
    };

    updateWorkout.mutate(
      {
        id: event.id,
        data: updatedData,
        date: event.date,
        type: event.type,
      },
      {
        onError: () => showError('운동 기록 저장에 실패했어요.'),
      },
    );
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
    workoutData,
    handleDelete,
    handleComplete,
    handleUncomplete,
    handleSetsChange,
    isCompleting: completeEvent.isPending,
    isUncompleting,
  };
}
