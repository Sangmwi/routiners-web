'use client';

/**
 * Coach Message Send Mutation (onMutate 패턴)
 *
 * Phase 13: flushSync + useReducer → React Query onMutate 패턴 전환
 *
 * 이 뮤테이션은 낙관적 업데이트만 담당:
 * - onMutate: 캐시에 optimistic 메시지 삽입
 * - onError: 자동 롤백
 * - SSE 콜백은 별도로 setQueryData 호출
 */

import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import { aiChatApi, ChatStreamCallbacks } from '@/lib/api/conversation';
import type { ChatMessage } from '@/lib/types/chat';
import type { CoachMessagePage } from '@/lib/types/coach';

// =============================================================================
// Types
// =============================================================================

interface SendMessageParams {
  conversationId: string;
  content: string;
  callbacks: ChatStreamCallbacks;
}

interface MutationContext {
  previousMessages: InfiniteData<CoachMessagePage> | undefined;
  optimisticMessageId: string;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * 코치 메시지 전송 뮤테이션 (onMutate 낙관적 업데이트)
 *
 * - flushSync 불필요: React Query 캐시가 동기적으로 업데이트됨
 * - pendingUserMessage 불필요: 캐시에 직접 삽입
 * - isDuplicate 체크 불필요: optimistic- prefix로 구분
 *
 * @returns useMutation 결과 + AbortController ref
 */
export function useSendCoachMessage() {
  const queryClient = useQueryClient();

  return useMutation<AbortController, Error, SendMessageParams, MutationContext>({
    mutationFn: async ({ conversationId, content, callbacks }) => {
      // SSE 시작 - AbortController 반환 (즉시 완료, 스트리밍은 백그라운드)
      return aiChatApi.sendMessage(conversationId, content, callbacks);
    },

    onMutate: async ({ conversationId, content }) => {
      // 1. 진행 중인 쿼리 취소 (낙관적 업데이트와 충돌 방지)
      await queryClient.cancelQueries({
        queryKey: queryKeys.coach.messages(conversationId),
      });

      // 2. 현재 캐시 스냅샷 저장 (롤백용)
      const previousMessages = queryClient.getQueryData<InfiniteData<CoachMessagePage>>(
        queryKeys.coach.messages(conversationId)
      );

      // 3. 낙관적 메시지 생성 (optimistic- prefix로 구분)
      const optimisticMessageId = `optimistic-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        id: optimisticMessageId,
        conversationId,
        role: 'user',
        content: content.trim(),
        contentType: 'text',
        createdAt: new Date().toISOString(),
      };

      // 4. 캐시에 낙관적 메시지 삽입
      // 무한스크롤: pages[0]이 가장 최신 페이지 (역순 정렬)
      queryClient.setQueryData<InfiniteData<CoachMessagePage>>(
        queryKeys.coach.messages(conversationId),
        (old) => {
          // 캐시가 없거나 페이지가 없으면 새 구조 생성
          if (!old || !old.pages?.length) {
            return {
              pages: [
                {
                  messages: [optimisticMessage],
                  hasMore: false,
                  nextCursor: undefined,
                },
              ],
              pageParams: [undefined],
            };
          }

          const newPages = [...old.pages];
          // 첫 번째 페이지 끝에 메시지 추가
          newPages[0] = {
            ...newPages[0],
            messages: [...newPages[0].messages, optimisticMessage],
          };

          return { ...old, pages: newPages };
        }
      );

      // 5. 롤백 컨텍스트 반환
      return { previousMessages, optimisticMessageId };
    },

    onError: (error, { conversationId }, context) => {
      // 오류 시 이전 캐시로 롤백
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.coach.messages(conversationId),
          context.previousMessages
        );
      }
      console.error('[useSendCoachMessage] Error:', error);
    },

    // onSuccess/onSettled: SSE onComplete 콜백에서 처리하므로 여기서는 생략
  });
}

// =============================================================================
// Utility: 낙관적 메시지 → 실제 메시지 교체
// =============================================================================

/**
 * 낙관적 메시지를 실제 서버 메시지로 교체
 *
 * SSE onComplete 콜백에서 호출:
 * - optimistic- prefix 메시지 제거
 * - 실제 유저 메시지 + AI 응답 메시지 삽입
 */
export function replaceOptimisticWithReal(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  newMessages: ChatMessage[]
) {
  queryClient.setQueryData<InfiniteData<CoachMessagePage>>(
    queryKeys.coach.messages(conversationId),
    (old) => {
      if (!old?.pages?.length) return old;

      const newPages = old.pages.map((page, idx) => {
        if (idx !== 0) return page; // 첫 페이지만 수정

        // optimistic- 메시지 제거하고 실제 메시지로 교체
        const filteredMessages = page.messages.filter(
          (m) => !m.id.startsWith('optimistic-')
        );

        return {
          ...page,
          messages: [...filteredMessages, ...newMessages],
        };
      });

      return { ...old, pages: newPages };
    }
  );
}

/**
 * 낙관적 메시지 제거 (오류 시 또는 스트림 취소 시)
 */
export function removeOptimisticMessages(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string
) {
  queryClient.setQueryData<InfiniteData<CoachMessagePage>>(
    queryKeys.coach.messages(conversationId),
    (old) => {
      if (!old?.pages?.length) return old;

      const newPages = old.pages.map((page) => ({
        ...page,
        messages: page.messages.filter((m) => !m.id.startsWith('optimistic-')),
      }));

      return { ...old, pages: newPages };
    }
  );
}
