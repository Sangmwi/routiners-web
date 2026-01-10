'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
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

/**
 * Routine Event Query Hooks
 *
 * 루틴 이벤트 관련 React Query 훅
 */

/**
 * 루틴 이벤트 목록 조회
 *
 * @param params - 필터 파라미터
 *
 * @example
 * const { data: events } = useRoutineEvents({
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-31',
 *   type: 'workout',
 * });
 */
export function useRoutineEvents(
  params: EventListParams = {},
  options?: Omit<UseQueryOptions<RoutineEvent[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.routineEvent.list(params),
    queryFn: () => routineEventApi.getEvents(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * 과거 + 미래 이벤트 조회 (캐러셀용)
 *
 * @param type - 이벤트 타입 ('workout' | 'meal')
 * @param pastDays - 과거 조회 일수 (기본 7일)
 * @param futureDays - 미래 조회 일수 (기본 14일)
 *
 * @example
 * const { data: workouts } = useUpcomingEvents('workout', 7, 14);
 * const { data: meals } = useUpcomingEvents('meal', 7, 14);
 */
export function useUpcomingEvents(
  type: EventType,
  pastDays: number = 7,
  futureDays: number = 14,
  options?: Omit<UseQueryOptions<RoutineEvent[]>, 'queryKey' | 'queryFn'>
) {
  const startDate = formatDate(addDays(new Date(), -pastDays));
  const endDate = formatDate(addDays(new Date(), futureDays));

  return useRoutineEvents(
    {
      type,
      startDate,
      endDate,
    },
    options
  );
}

// ============================================================================
// Date Helpers
// ============================================================================

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 특정 날짜의 이벤트 조회
 *
 * @param date - 날짜 (YYYY-MM-DD)
 * @param type - 이벤트 타입 (optional)
 *
 * @example
 * const { data: event } = useRoutineEventByDate('2025-01-15', 'workout');
 */
export function useRoutineEventByDate(
  date: string | undefined,
  type?: EventType,
  options?: Omit<UseQueryOptions<RoutineEvent | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.routineEvent.byDate(date || '', type),
    queryFn: () => routineEventApi.getEventByDate(date!, type),
    enabled: !!date,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * 특정 이벤트 상세 조회
 *
 * @param id - 이벤트 ID
 *
 * @example
 * const { data: event } = useRoutineEvent('event-id');
 */
export function useRoutineEvent(
  id: string | undefined,
  options?: Omit<UseQueryOptions<RoutineEvent | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.routineEvent.detail(id || ''),
    queryFn: () => routineEventApi.getEvent(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * 월별 캘린더 요약 조회
 *
 * @param year - 연도
 * @param month - 월 (1-12)
 *
 * @example
 * const { data: events } = useCalendarEvents(2025, 1);
 */
export function useCalendarEvents(
  year: number,
  month: number,
  options?: Omit<UseQueryOptions<CalendarEventSummary[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.routineEvent.monthSummary(year, month),
    queryFn: () => routineEventApi.getMonthSummary(year, month),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
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
      // 상세 캐시 설정
      queryClient.setQueryData(
        queryKeys.routineEvent.detail(newEvent.id),
        newEvent
      );

      // 날짜별 캐시 설정
      queryClient.setQueryData(
        queryKeys.routineEvent.byDate(newEvent.date, newEvent.type),
        newEvent
      );

      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.routineEvent.all,
      });
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
      // 각 이벤트의 상세 및 날짜별 캐시 설정
      newEvents.forEach((event) => {
        queryClient.setQueryData(
          queryKeys.routineEvent.detail(event.id),
          event
        );
        queryClient.setQueryData(
          queryKeys.routineEvent.byDate(event.date, event.type),
          event
        );
      });

      // 목록 및 캘린더 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.routineEvent.all,
      });

      // AI 세션 캐시 무효화 (result_applied 변경됨)
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiSession.all,
      });
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
      // 상세 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.routineEvent.detail(updatedEvent.id),
        updatedEvent
      );

      // 날짜별 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.routineEvent.byDate(updatedEvent.date, updatedEvent.type),
        updatedEvent
      );

      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.routineEvent.all,
      });
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
      // 상세 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.routineEvent.detail(updatedEvent.id),
        updatedEvent
      );

      // 날짜별 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.routineEvent.byDate(updatedEvent.date, updatedEvent.type),
        updatedEvent
      );

      // 목록 및 캘린더 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.routineEvent.all,
      });
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
      // 상세 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.routineEvent.detail(updatedEvent.id),
        updatedEvent
      );

      // 날짜별 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.routineEvent.byDate(updatedEvent.date, updatedEvent.type),
        updatedEvent
      );

      // 목록 및 캘린더 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.routineEvent.all,
      });
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
      // 상세 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.routineEvent.detail(updatedEvent.id),
        updatedEvent
      );

      // 날짜별 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.routineEvent.byDate(updatedEvent.date, updatedEvent.type),
        updatedEvent
      );
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
      // 상세 캐시 제거
      queryClient.removeQueries({
        queryKey: queryKeys.routineEvent.detail(eventId),
      });

      // 목록 및 캘린더 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.routineEvent.all,
      });
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
      // 목록 및 캘린더 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.routineEvent.all,
      });

      // AI 세션 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiSession.all,
      });
    },
  });
}
