'use client';

import { useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import {
  counselorApi,
  counselorMessageApi,
  fetchCounselorConversations,
  fetchActiveCounselorConversation,
} from '@/lib/api/counselor';
import type {
  CounselorConversation,
  CounselorConversationsResponse,
  CounselorMessagePage,
} from '@/lib/types/counselor';
import { useBaseQuery, STALE_TIME } from '@/hooks/common';

// ============================================================================
// Standard Query Hooks
// ============================================================================

/**
 * 상담 대화 목록 조회
 *
 * @example
 * const { data, isPending } = useCounselorConversations();
 */
export function useCounselorConversations() {
  return useBaseQuery<CounselorConversationsResponse>(
    queryKeys.counselor.conversations(),
    fetchCounselorConversations,
    { staleTime: 'medium' }
  );
}

/**
 * 활성 상담 대화 조회
 *
 * @description
 * SSR prefetch와 함께 사용. 동일한 queryKey로 hydration.
 * Server Component에서 fetchActiveCounselorConversationServer로 prefetch 필요.
 */
export function useActiveCounselorConversation() {
  return useBaseQuery<CounselorConversation | null>(
    queryKeys.counselor.activeConversation(),
    fetchActiveCounselorConversation,
    { staleTime: 'active' }
  );
}

/**
 * 특정 상담 대화 조회
 */
export function useCounselorConversation(conversationId: string | undefined) {
  return useBaseQuery<CounselorConversation | null>(
    queryKeys.counselor.conversation(conversationId || ''),
    () => counselorApi.getConversation(conversationId!),
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
 * 상담 메시지 무한스크롤 조회
 *
 * @example
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useInfiniteCounselorMessages(conversationId);
 *
 * // 메시지 평탄화
 * const messages = data?.pages.flatMap(p => p.messages) ?? [];
 */
export function useInfiniteCounselorMessages(
  conversationId: string | null
): UseInfiniteQueryResult<{ pages: CounselorMessagePage[]; pageParams: unknown[] }> {
  return useInfiniteQuery({
    queryKey: conversationId ? queryKeys.counselor.messages(conversationId) : ['disabled'],
    queryFn: async ({ pageParam }) => {
      return counselorMessageApi.getMessages(conversationId!, pageParam as string | undefined);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!conversationId,
    staleTime: STALE_TIME.short,
  });
}

