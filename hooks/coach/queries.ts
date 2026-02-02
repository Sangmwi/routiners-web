'use client';

import { useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import {
  coachApi,
  coachMessageApi,
  fetchCoachConversations,
  fetchActiveCoachConversation,
} from '@/lib/api/coach';
import type {
  CoachConversation,
  CoachConversationsResponse,
  CoachMessagePage,
} from '@/lib/types/coach';
import { useBaseQuery, STALE_TIME } from '@/hooks/common';

// ============================================================================
// Standard Query Hooks
// ============================================================================

/**
 * 코치 대화 목록 조회
 *
 * @example
 * const { data, isPending } = useCoachConversations();
 */
export function useCoachConversations() {
  return useBaseQuery<CoachConversationsResponse>(
    queryKeys.coach.conversations(),
    fetchCoachConversations,
    { staleTime: 'medium' }
  );
}

/**
 * 활성 코치 대화 조회
 *
 * @description
 * SSR prefetch와 함께 사용. 동일한 queryKey로 hydration.
 * Server Component에서 fetchActiveCoachConversationServer로 prefetch 필요.
 */
export function useActiveCoachConversation() {
  return useBaseQuery<CoachConversation | null>(
    queryKeys.coach.activeConversation(),
    fetchActiveCoachConversation,
    { staleTime: 'active' }
  );
}

/**
 * 특정 코치 대화 조회
 */
export function useCoachConversation(conversationId: string | undefined) {
  return useBaseQuery<CoachConversation | null>(
    queryKeys.coach.conversation(conversationId || ''),
    () => coachApi.getConversation(conversationId!),
    {
      staleTime: 'short',
      enabled: !!conversationId,
    }
  );
}

// ============================================================================
// Infinite Query Hooks (메시지 무한스크롤)
// ============================================================================

/**
 * 코치 메시지 무한스크롤 조회
 *
 * @example
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useInfiniteCoachMessages(conversationId);
 *
 * // 메시지 평탄화
 * const messages = data?.pages.flatMap(p => p.messages) ?? [];
 */
export function useInfiniteCoachMessages(
  conversationId: string | null
): UseInfiniteQueryResult<{ pages: CoachMessagePage[]; pageParams: unknown[] }> {
  return useInfiniteQuery({
    queryKey: conversationId ? queryKeys.coach.messages(conversationId) : ['disabled'],
    queryFn: async ({ pageParam }) => {
      return coachMessageApi.getMessages(conversationId!, pageParam as string | undefined);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!conversationId,
    staleTime: STALE_TIME.short,
  });
}

