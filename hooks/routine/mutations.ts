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
 * 猷⑦떞 ?대깽???앹꽦 Mutation (?⑥씪)
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
 * 猷⑦떞 ?대깽???쇨큵 ?앹꽦 Mutation (AI ?앹꽦 4二쇱튂)
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
 * 猷⑦떞 ?대깽???섏젙 Mutation
 *
 * @example
 * const updateEvent = useUpdateRoutineEvent();
 * updateEvent.mutate({ id: 'event-id', data: { title: '???쒕ぉ' } });
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
 * ?대깽???꾨즺 Mutation
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
 * ?뚰겕?꾩썐 ?곗씠???낅뜲?댄듃 Mutation
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
 * ?앸떒 ?곗씠???낅뜲?댄듃 Mutation
 *
 * useUpdateWorkoutData? ?숈씪???숆????낅뜲?댄듃 ?⑦꽩
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
 * 猷⑦떞 ?대깽????젣 Mutation
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
 * AI ?몄뀡怨??곌껐???대깽?몃뱾 ??젣 Mutation
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
 * ?앸떒 ?대깽??諛곗튂 ?앹꽦 Mutation (遺? ?앸떒 遺덈윭?ㅺ린??
 *
 * AI 諛곗튂? ?щ━ aiSessionId 遺덊븘?? 異⑸룎 ?좎쭨???쒕쾭?먯꽌 ?ㅽ궢 泥섎━.
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

