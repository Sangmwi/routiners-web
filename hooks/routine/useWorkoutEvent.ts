'use client';

import { useRouter } from 'next/navigation';
import { useShowError } from '@/lib/stores/errorStore';
import { isWorkoutData } from '@/lib/types/guards';
import { useRoutineEventByDateSuspense } from './queries';
import { useCompleteRoutineEvent, useUpdateWorkoutData } from './mutations';
import { clearPersistedTimer } from './useWorkoutSession';
import { useRoutineEventConfirmActions } from './useRoutineEventConfirmActions';
import { useRoutineEventDataMutation } from './useRoutineEventDataMutation';
import type { WorkoutData, WorkoutSet } from '@/lib/types/routine';

export function useWorkoutEvent(date: string) {
  const router = useRouter();
  const showError = useShowError();

  const { data: event } = useRoutineEventByDateSuspense(date, 'workout');
  const workoutData: WorkoutData | null =
    event && isWorkoutData(event.data) ? event.data : null;

  const completeEvent = useCompleteRoutineEvent();
  const updateWorkout = useUpdateWorkoutData();
  const { mutateData } = useRoutineEventDataMutation(event, updateWorkout);
  const { confirmDelete, confirmUncomplete, isUncompleting } =
    useRoutineEventConfirmActions();

  const handleDelete = () => {
    if (!event) return;

    confirmDelete(event, {
      errorMessage: '운동 삭제에 실패했어요.',
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

    mutateData(updatedData, {
      errorMessage: '운동 기록 저장에 실패했어요.',
    });
  };

  const handleUncomplete = () => {
    if (!event || event.status !== 'completed') return;

    confirmUncomplete(event, {
      errorMessage: '되돌리기에 실패했어요.',
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
