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
import type { MealData } from '@/lib/types/meal';
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
 * Routine event create mutation (single)
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
 * Routine event batch create mutation (AI 4-week plan)
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
 * Routine event update mutation
 *
 * @example
 * const updateEvent = useUpdateRoutineEvent();
 * updateEvent.mutate({ id: 'event-id', data: { title: 'Updated title' } });
 */
export function useUpdateRoutineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoutineEventUpdateData }) =>
      routineEventApi.updateEvent(id, data),

    onSuccess: (updatedEvent) => {
      updateEventCacheAndInvalidate(queryClient, updatedEvent);
      // 되돌리기 시 Big3 auto 레코드 삭제 반영
      if (updatedEvent.status === 'scheduled') {
        queryClient.invalidateQueries({ queryKey: queryKeys.big3.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
      }
    },

    onError: (error) => {
      console.error('[RoutineEvent] Update failed:', error);
    },
  });
}

/**
 * Routine event complete mutation
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
      // Big3 자동 캡처 반영: 운동 완료 시 big3/progress 캐시 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.big3.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
    },

    onError: (error) => {
      console.error('[RoutineEvent] Complete failed:', error);
    },
  });
}

type OptimisticMutationVars<TData> = {
  id: string;
  data: TData;
  date: string;
  type: EventType;
};

type OptimisticMutationContext = {
  previousEvent?: RoutineEvent;
};

/**
 * Shared optimistic event-data mutation used by workout/meal updates.
 */
export function useOptimisticEventDataMutation<TData>(
  mutationFn: (
    vars: OptimisticMutationVars<TData>,
  ) => Promise<RoutineEvent>,
  errorLabel: string,
) {
  const queryClient = useQueryClient();

  return useMutation<
    RoutineEvent,
    unknown,
    OptimisticMutationVars<TData>,
    OptimisticMutationContext
  >({
    mutationFn,

    onMutate: async ({ id, data, date, type }) => {
      const byDateKey = queryKeys.routineEvent.byDate(date, type);
      const detailKey = queryKeys.routineEvent.detail(id);

      await queryClient.cancelQueries({ queryKey: byDateKey });
      await queryClient.cancelQueries({ queryKey: detailKey });

      const previousEvent =
        queryClient.getQueryData<RoutineEvent>(byDateKey) ??
        queryClient.getQueryData<RoutineEvent>(detailKey);

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
      console.error(`[RoutineEvent] ${errorLabel} failed:`, error);
      if (context?.previousEvent) {
        updateEventCache(queryClient, context.previousEvent);
      }
    },
  });
}

/**
 * Workout data update mutation
 *
 * @example
 * const updateWorkout = useUpdateWorkoutData();
 * updateWorkout.mutate({ id: 'event-id', data: workoutData });
 */
export function useUpdateWorkoutData() {
  return useOptimisticEventDataMutation<WorkoutData>(
    ({ id, data }) => routineEventApi.updateWorkoutData(id, data),
    'Workout data update',
  );
}

/**
 * Meal data update mutation
 *
 * Uses the same optimistic update pattern as useUpdateWorkoutData.
 *
 * @example
 * const updateMeal = useUpdateMealData();
 * updateMeal.mutate({ id: 'event-id', data: mealData, date: '2026-02-21', type: 'meal' });
 */
export function useUpdateMealData() {
  return useOptimisticEventDataMutation<MealData>(
    ({ id, data }) => routineEventApi.updateEvent(id, { data }),
    'Meal data update',
  );
}

/**
 * Routine event delete mutation
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
      // 삭제 시 Big3 auto 레코드도 서버에서 삭제됨 → 캐시 반영
      queryClient.invalidateQueries({ queryKey: queryKeys.big3.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
    },

    onError: (error) => {
      console.error('[RoutineEvent] Delete failed:', error);
    },
  });
}

/**
 * Delete events linked to an AI session mutation
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
 * Meal event batch create mutation (import preset meal plans)
 *
 * For meal batches, aiSessionId is optional and conflict handling is done server-side.
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

