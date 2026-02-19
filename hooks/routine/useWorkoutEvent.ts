'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useShowError } from '@/lib/stores/errorStore';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import { queryKeys } from '@/lib/constants/queryKeys';
import { isWorkoutData } from '@/lib/types/guards';
import {
  useRoutineEventByDateSuspense,
  useCompleteRoutineEvent,
  useSkipRoutineEvent,
  useUpdateWorkoutData,
  useDeleteRoutineEvent,
} from '@/hooks/routine';
import { clearPersistedTimer } from './useWorkoutSession';
import type { WorkoutSet, WorkoutData, RoutineEvent } from '@/lib/types/routine';

/**
 * 운동 이벤트 데이터 + 뮤테이션 로직 훅
 *
 * WorkoutContent에서 비즈니스 로직을 분리하여
 * 컴포넌트가 UI 렌더링에만 집중할 수 있도록 한다.
 */
export function useWorkoutEvent(date: string) {
  const router = useRouter();
  const showError = useShowError();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();

  // 데이터 조회
  const { data: event } = useRoutineEventByDateSuspense(date, 'workout');

  // 뮤테이션
  const completeEvent = useCompleteRoutineEvent();
  const skipEvent = useSkipRoutineEvent();
  const updateWorkout = useUpdateWorkoutData();
  const deleteEvent = useDeleteRoutineEvent();

  // 운동 데이터 추출
  const workoutData: WorkoutData | null =
    event && isWorkoutData(event.data) ? event.data : null;

  // 삭제
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

  // 완료
  const handleComplete = () => {
    if (!event) return;
    completeEvent.mutate(event.id, {
      onSuccess: () => {
        clearPersistedTimer();
        router.back();
      },
      onError: () => showError('운동 완료에 실패했어요'),
    });
  };

  // 건너뛰기
  const handleSkip = () => {
    if (!event) return;
    skipEvent.mutate(event.id, {
      onError: () => showError('운동 스킵에 실패했어요'),
    });
  };

  // 세트 변경 (overview 모드 ExerciseCard 편집용)
  const handleSetsChange = (exerciseId: string, sets: WorkoutSet[]) => {
    if (!event || !workoutData) return;

    const updatedExercises = workoutData.exercises.map((ex) =>
      ex.id === exerciseId ? { ...ex, sets } : ex
    );
    const updatedData = { ...workoutData, exercises: updatedExercises };

    // 동기적 낙관적 캐시 업데이트 (즉시 UI 반영)
    const byDateKey = queryKeys.routineEvent.byDate(date, 'workout');
    queryClient.setQueryData(byDateKey, { ...event, data: updatedData });

    // 서버 동기화
    updateWorkout.mutate(
      { id: event.id, data: updatedData, date: event.date, type: event.type },
      {
        onError: () => {
          queryClient.setQueryData(byDateKey, event);
          showError('운동 기록 저장에 실패했어요');
        },
      }
    );
  };

  return {
    event,
    workoutData,
    handleDelete,
    handleComplete,
    handleSkip,
    handleSetsChange,
    isCompleting: completeEvent.isPending,
    isSkipping: skipEvent.isPending,
  };
}
