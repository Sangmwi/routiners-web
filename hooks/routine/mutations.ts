'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RoutineEventCreateData,
  RoutineEventUpdateData,
  RoutineBatchCreateData,
  WorkoutData,
} from '@/lib/types/routine';
import { routineEventApi } from '@/lib/api/routineEvent';
import {
  updateEventCacheAndInvalidate,
  updateBatchEventCacheWithAI,
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

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkoutData }) =>
      routineEventApi.updateWorkoutData(id, data),

    onSuccess: (updatedEvent) => {
      // 상세 + 날짜별 캐시 업데이트 (목록 무효화는 불필요 - workout_data만 변경)
      updateEventCache(queryClient, updatedEvent);
    },

    onError: (error) => {
      console.error('[RoutineEvent] Workout data update failed:', error);
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

  return useMutation({
    mutationFn: routineEventApi.deleteEvent,

    onSuccess: (_, eventId) => {
      removeEventCache(queryClient, eventId);
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
