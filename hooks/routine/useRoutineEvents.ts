'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RoutineEvent,
  RoutineEventCreateData,
  RoutineEventUpdateData,
  RoutineBatchCreateData,
  CalendarEventSummary,
  WorkoutData,
  EventType,
} from '@/lib/types/routine';
import { routineEventApi, EventListParams } from '@/lib/api/routineEvent';
import { queryKeys } from '@/lib/constants/queryKeys';
import { formatDate, addDays } from '@/lib/utils/dateHelpers';
import {
  updateEventCacheAndInvalidate,
  updateBatchEventCacheWithAI,
  removeEventCache,
  updateEventCache,
  invalidateEventLists,
  invalidateAISessions,
} from '@/lib/utils/routineEventCacheHelper';
import { useBaseQuery, useConditionalQuery } from '@/hooks/common/useBaseQuery';

/**
 * Routine Event Query Hooks
 *
 * 루틴 이벤트 관련 React Query 훅
 */

/**
 * 루틴 이벤트 목록 조회
 */
export function useRoutineEvents(params: EventListParams = {}) {
  return useBaseQuery(
    queryKeys.routineEvent.list(params),
    () => routineEventApi.getEvents(params)
  );
}

/**
 * 과거 + 미래 이벤트 조회 (캐러셀용)
 */
export function useUpcomingEvents(
  type: EventType,
  pastDays: number = 7,
  futureDays: number = 14
) {
  const startDate = formatDate(addDays(new Date(), -pastDays));
  const endDate = formatDate(addDays(new Date(), futureDays));

  return useRoutineEvents({ type, startDate, endDate });
}

/**
 * 특정 날짜의 이벤트 조회
 */
export function useRoutineEventByDate(date: string | undefined, type?: EventType) {
  return useConditionalQuery(
    queryKeys.routineEvent.byDate(date || '', type),
    () => routineEventApi.getEventByDate(date!, type),
    date
  );
}

/**
 * 특정 이벤트 상세 조회
 */
export function useRoutineEvent(id: string | undefined) {
  return useConditionalQuery(
    queryKeys.routineEvent.detail(id || ''),
    () => routineEventApi.getEvent(id!),
    id
  );
}

/**
 * 월별 캘린더 요약 조회
 */
export function useCalendarEvents(year: number, month: number) {
  return useBaseQuery(
    queryKeys.routineEvent.monthSummary(year, month),
    () => routineEventApi.getMonthSummary(year, month)
  );
}

/**
 * Routine Event Mutation Hooks
 */

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
