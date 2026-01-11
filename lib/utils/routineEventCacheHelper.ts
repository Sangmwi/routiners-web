/**
 * Routine Event Cache Helper
 *
 * 루틴 이벤트 관련 React Query 캐시 업데이트 유틸리티
 * 중복 패턴을 통합하여 일관된 캐시 관리 제공
 */

import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import type { RoutineEvent } from '@/lib/types/routine';

/**
 * 루틴 이벤트 캐시 업데이트 (상세 + 날짜별)
 *
 * @param queryClient - React Query 클라이언트
 * @param event - 업데이트할 이벤트 데이터
 *
 * @example
 * updateEventCache(queryClient, updatedEvent);
 */
export function updateEventCache(
  queryClient: QueryClient,
  event: RoutineEvent
): void {
  // 상세 캐시 업데이트
  queryClient.setQueryData(queryKeys.routineEvent.detail(event.id), event);

  // 날짜별 캐시 업데이트
  queryClient.setQueryData(
    queryKeys.routineEvent.byDate(event.date, event.type),
    event
  );
}

/**
 * 루틴 이벤트 목록/캘린더 캐시 무효화
 *
 * @param queryClient - React Query 클라이언트
 *
 * @example
 * invalidateEventLists(queryClient);
 */
export function invalidateEventLists(queryClient: QueryClient): void {
  queryClient.invalidateQueries({
    queryKey: queryKeys.routineEvent.all,
  });
}

/**
 * AI 세션 캐시 무효화
 *
 * @param queryClient - React Query 클라이언트
 *
 * @example
 * invalidateAISessions(queryClient);
 */
export function invalidateAISessions(queryClient: QueryClient): void {
  queryClient.invalidateQueries({
    queryKey: queryKeys.aiSession.all,
  });
}

/**
 * 이벤트 캐시 업데이트 + 목록 무효화 (일반 업데이트용)
 *
 * @param queryClient - React Query 클라이언트
 * @param event - 업데이트할 이벤트 데이터
 *
 * @example
 * // onSuccess에서 사용
 * onSuccess: (event) => updateEventCacheAndInvalidate(queryClient, event),
 */
export function updateEventCacheAndInvalidate(
  queryClient: QueryClient,
  event: RoutineEvent
): void {
  updateEventCache(queryClient, event);
  invalidateEventLists(queryClient);
}

/**
 * 다중 이벤트 캐시 업데이트 (배치 생성용)
 *
 * @param queryClient - React Query 클라이언트
 * @param events - 업데이트할 이벤트 배열
 *
 * @example
 * updateBatchEventCache(queryClient, newEvents);
 */
export function updateBatchEventCache(
  queryClient: QueryClient,
  events: RoutineEvent[]
): void {
  events.forEach((event) => updateEventCache(queryClient, event));
}

/**
 * 이벤트 삭제 시 캐시 정리
 *
 * @param queryClient - React Query 클라이언트
 * @param eventId - 삭제된 이벤트 ID
 *
 * @example
 * removeEventCache(queryClient, 'event-id');
 */
export function removeEventCache(
  queryClient: QueryClient,
  eventId: string
): void {
  queryClient.removeQueries({
    queryKey: queryKeys.routineEvent.detail(eventId),
  });
  invalidateEventLists(queryClient);
}

/**
 * AI 배치 생성 후 캐시 업데이트
 *
 * @param queryClient - React Query 클라이언트
 * @param events - 생성된 이벤트 배열
 *
 * @example
 * updateBatchEventCacheWithAI(queryClient, newEvents);
 */
export function updateBatchEventCacheWithAI(
  queryClient: QueryClient,
  events: RoutineEvent[]
): void {
  updateBatchEventCache(queryClient, events);
  invalidateEventLists(queryClient);
  invalidateAISessions(queryClient);
}
