'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RoutineEventCreateData,
  RoutineEventUpdateData,
  RoutineBatchCreateData,
  RoutineEvent,
  EventType,
  WorkoutData,
} from '@/lib/types/routine';
import type { MealBatchCreateData } from '@/lib/types/unitMeal';
import { queryKeys } from '@/lib/constants/queryKeys';
import { routineEventApi } from '@/lib/api/routineEvent';
import { unitMealApi } from '@/lib/api/unitMeal';
import {
  updateEventCacheAndInvalidate,
  updateBatchEventCacheWithAI,
  updateBatchEventCache,
  removeEventCache,
  updateEventCache,
  invalidateEventLists,
  invalidateAISessions,
} from '@/lib/utils/routineEventCacheHelper';

// ============================================================================
// Routine Event Mutations
// ============================================================================

/**
 * 루틴 이벤트 생성 Mutation (단일)
 *
 * @example
 * const createEvent = useCreateRoutineEvent();
 * createEvent.mutate(eventData);
 */
export function useCreateRoutineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RoutineEventCreateData) =>
      routineEventApi.createEvent(data),

    onSuccess: (newEvent) => {
      updateEventCacheAndInvalidate(queryClient, newEvent);
    },

    onError: (error) => {
      console.error('[RoutineEvent] Create failed:', error);
    },
  });
}

/**
 * 루틴 이벤트 일괄 생성 Mutation (AI 생성 4주치)
 *
 * @example
 * const createBatch = useCreateRoutineEventsBatch();
 * createBatch.mutate({ events, aiSessionId });
 */
export function useCreateRoutineEventsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RoutineBatchCreateData) =>
      routineEventApi.createEventsBatch(data),

    onSuccess: (newEvents) => {
      updateBatchEventCacheWithAI(queryClient, newEvents);
    },

    onError: (error) => {
      console.error('[RoutineEvent] Batch create failed:', error);
    },
  });
}

/**
 * 루틴 이벤트 수정 Mutation
 *
 * @example
 * const updateEvent = useUpdateRoutineEvent();
 * updateEvent.mutate({ id: 'event-id', data: { title: '새 제목' } });
 */
export function useUpdateRoutineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoutineEventUpdateData }) =>
      routineEventApi.updateEvent(id, data),

    onSuccess: (updatedEvent) => {
      updateEventCacheAndInvalidate(queryClient, updatedEvent);
    },

    onError: (error) => {
      console.error('[RoutineEvent] Update failed:', error);
    },
  });
}

/**
 * 이벤트 완료 Mutation
 *
 * @example
 * const complete = useCompleteRoutineEvent();
 * complete.mutate('event-id');
 */
export function useCompleteRoutineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: routineEventApi.completeEvent,

    onSuccess: (updatedEvent) => {
      updateEventCacheAndInvalidate(queryClient, updatedEvent);
    },

    onError: (error) => {
      console.error('[RoutineEvent] Complete failed:', error);
    },
  });
}

/**
 * 이벤트 건너뛰기 Mutation
 *
 * @example
 * const skip = useSkipRoutineEvent();
 * skip.mutate('event-id');
 */
export function useSkipRoutineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: routineEventApi.skipEvent,

    onSuccess: (updatedEvent) => {
      updateEventCacheAndInvalidate(queryClient, updatedEvent);
    },

    onError: (error) => {
      console.error('[RoutineEvent] Skip failed:', error);
    },
  });
}

/**
 * 워크아웃 데이터 업데이트 Mutation
 *
 * @example
 * const updateWorkout = useUpdateWorkoutData();
 * updateWorkout.mutate({ id: 'event-id', data: workoutData });
 */
export function useUpdateWorkoutData() {
  const queryClient = useQueryClient();

  type Vars = { id: string; data: WorkoutData; date: string; type: EventType };

  return useMutation({
    mutationFn: ({ id, data }: Vars) =>
      routineEventApi.updateWorkoutData(id, data),

    onMutate: async ({ id, data, date, type }: Vars) => {
      const byDateKey = queryKeys.routineEvent.byDate(date, type);
      const detailKey = queryKeys.routineEvent.detail(id);

      // 진행 중인 refetch 취소 (낙관적 업데이트와 충돌 방지)
      await queryClient.cancelQueries({ queryKey: byDateKey });
      await queryClient.cancelQueries({ queryKey: detailKey });

      // byDate 캐시에서 이벤트 조회 (상세 페이지가 이 키를 사용)
      const previousEvent =
        queryClient.getQueryData<RoutineEvent>(byDateKey) ??
        queryClient.getQueryData<RoutineEvent>(detailKey);

      // 캐시를 낙관적으로 업데이트
      if (previousEvent) {
        const optimistic = { ...previousEvent, data };
        queryClient.setQueryData(byDateKey, optimistic);
        queryClient.setQueryData(detailKey, optimistic);
      }

      return { previousEvent };
    },

    onSuccess: (updatedEvent) => {
      updateEventCache(queryClient, updatedEvent);
    },

    onError: (error, _vars, context) => {
      console.error('[RoutineEvent] Workout data update failed:', error);
      if (context?.previousEvent) {
        updateEventCache(queryClient, context.previousEvent);
      }
    },
  });
}

/**
 * 루틴 이벤트 삭제 Mutation
 *
 * @example
 * const deleteEvent = useDeleteRoutineEvent();
 * deleteEvent.mutate('event-id');
 */
export function useDeleteRoutineEvent() {
  const queryClient = useQueryClient();

  type DeleteVars = { id: string; date: string; type: EventType };

  return useMutation({
    mutationFn: ({ id }: DeleteVars) => routineEventApi.deleteEvent(id),

    onSuccess: (_, { id, date, type }) => {
      removeEventCache(queryClient, id, date, type);
    },

    onError: (error) => {
      console.error('[RoutineEvent] Delete failed:', error);
    },
  });
}

/**
 * AI 세션과 연결된 이벤트들 삭제 Mutation
 *
 * @example
 * const deleteBySession = useDeleteRoutineEventsBySession();
 * deleteBySession.mutate('session-id');
 */
export function useDeleteRoutineEventsBySession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: routineEventApi.deleteEventsBySession,

    onSuccess: () => {
      invalidateEventLists(queryClient);
      invalidateAISessions(queryClient);
    },

    onError: (error) => {
      console.error('[RoutineEvent] Delete by session failed:', error);
    },
  });
}

/**
 * 식단 이벤트 배치 생성 Mutation (부대 식단 불러오기용)
 *
 * AI 배치와 달리 aiSessionId 불필요. 충돌 날짜는 서버에서 스킵 처리.
 *
 * @example
 * const createBatch = useCreateMealEventsBatch();
 * createBatch.mutate({ events });
 */
export function useCreateMealEventsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MealBatchCreateData) =>
      unitMealApi.createMealBatch(data.events),

    onSuccess: (result) => {
      updateBatchEventCache(queryClient, result.created);
      invalidateEventLists(queryClient);
    },

    onError: (error) => {
      console.error('[RoutineEvent] Meal batch create failed:', error);
    },
  });
}
