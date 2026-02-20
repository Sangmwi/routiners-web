/**
 * Routine Event Cache Helper
 *
 * 루틴 이벤트 관련 React Query 캐시 업데이트 유틸리티
 * 중복 패턴을 통합하여 일관된 캐시 관리 제공
 */

import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import type { RoutineEvent } from '@/lib/types/routine';

// ============================================================================
// Cross-Domain Composite Invalidation
// ============================================================================

/**
 * 루틴 적용 후 관련 캐시 전체 무효화
 *
 * 상담 채팅에서 루틴 적용 시 사용 (counselor + routineEvent + aiSession 3개 도메인)
 *
 * @param queryClient - React Query 클라이언트
 * @param conversationId - 대화 ID
 *
 * @example
 * onSuccess: (_, { conversationId }) => {
 *   invalidateAfterRoutineApply(queryClient, conversationId);
 * }
 */
export function invalidateAfterRoutineApply(
  queryClient: QueryClient,
  conversationId: string
): void {
  // 상담 대화 캐시
  queryClient.invalidateQueries({
    queryKey: queryKeys.counselor.conversation(conversationId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.counselor.conversations(),
  });
  // 루틴 이벤트 캐시
  invalidateEventLists(queryClient);
  // AI 세션 캐시
  invalidateAISessions(queryClient);
}

// ============================================================================
// Single-Domain Cache Helpers
// ============================================================================

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
 * list와 month 쿼리만 무효화.
 * byDate, detail 캐시는 updateEventCache()에서 직접 세팅하므로 제외.
 * (전체 무효화 시 byDate 캐시가 즉시 무효화되어 레이스 컨디션 발생)
 *
 * @param queryClient - React Query 클라이언트
 *
 * @example
 * invalidateEventLists(queryClient);
 */
export function invalidateEventLists(queryClient: QueryClient): void {
  queryClient.invalidateQueries({
    queryKey: [...queryKeys.routineEvent.all, 'list'],
  });
  queryClient.invalidateQueries({
    queryKey: [...queryKeys.routineEvent.all, 'month'],
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
 * detail + byDate 캐시를 직접 제거하고 list/month를 무효화.
 * (byDate 캐시를 제거하지 않으면 메인탭 등에서 삭제된 이벤트가 남아있음)
 *
 * @param queryClient - React Query 클라이언트
 * @param eventId - 삭제된 이벤트 ID
 * @param date - 이벤트 날짜 (YYYY-MM-DD)
 * @param type - 이벤트 타입
 *
 * @example
 * removeEventCache(queryClient, 'event-id', '2026-02-20', 'workout');
 */
export function removeEventCache(
  queryClient: QueryClient,
  eventId: string,
  date?: string,
  type?: 'workout' | 'meal'
): void {
  queryClient.removeQueries({
    queryKey: queryKeys.routineEvent.detail(eventId),
  });
  if (date) {
    queryClient.setQueryData(
      queryKeys.routineEvent.byDate(date, type),
      null
    );
  }
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
