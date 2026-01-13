'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SessionPurpose } from '@/lib/types/routine';
import { conversationApi, ConversationListParams } from '@/lib/api/conversation';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useBaseQuery, useConditionalQuery } from '@/hooks/common/useBaseQuery';

/**
 * AI Session Query Hooks (새 스키마 버전)
 *
 * conversations + chat_messages 테이블 사용
 * 기존 AISession 인터페이스와 호환 유지 (AISessionCompat)
 */

/**
 * AI 대화 목록 조회
 */
export function useAISessions(
  params: ConversationListParams = {},
  options?: { enabled?: boolean }
) {
  return useBaseQuery(
    queryKeys.aiSession.list(params),
    () => conversationApi.getConversations({ type: 'ai', ...params }),
    options
  );
}

/**
 * 현재 활성 세션 조회
 *
 * staleTime 30초: 활성 세션은 자주 변경될 수 있음
 */
export function useActiveAISession(purpose: SessionPurpose) {
  return useBaseQuery(
    queryKeys.aiSession.active(purpose),
    () => conversationApi.getActiveAIConversation(purpose),
    { staleTime: 'active' }
  );
}

/**
 * 특정 세션 상세 조회 (메타데이터만)
 */
export function useAISession(id: string | undefined, options?: { enabled?: boolean }) {
  return useConditionalQuery(
    queryKeys.aiSession.detail(id || ''),
    () => conversationApi.getConversation(id!),
    options?.enabled === false ? false : id,
    { staleTime: 'active' }
  );
}

/**
 * 특정 AI 세션 상세 조회 (메시지 포함)
 */
export function useAISessionWithMessages(id: string | undefined, options?: { enabled?: boolean }) {
  return useConditionalQuery(
    queryKeys.aiSession.detail(id || ''),
    () => conversationApi.getAISession(id!),
    options?.enabled === false ? false : id,
    { staleTime: 'active' }
  );
}

/**
 * AI Session Mutation Hooks
 */

interface AISessionCreateData {
  purpose: SessionPurpose;
  title?: string;
}

/**
 * AI 세션 생성 Mutation
 *
 * @example
 * const createSession = useCreateAISession();
 *
 * createSession.mutate({ purpose: 'workout' }, {
 *   onSuccess: (session) => {
 *     router.push(`/routine/chat`);
 *   },
 * });
 */
export function useCreateAISession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AISessionCreateData) =>
      conversationApi.createConversation({
        type: 'ai',
        aiPurpose: data.purpose,
        title: data.title,
      }),

    onSuccess: (newSession) => {
      // 진행 중인 쿼리 취소 → race condition 방지
      // 쿼리가 완료되면 서버 응답으로 캐시를 덮어쓰는데, 이를 방지
      queryClient.cancelQueries({
        queryKey: queryKeys.aiSession.active(newSession.purpose),
      });

      // 활성 세션 캐시 업데이트 (AISessionCompat.purpose 사용)
      queryClient.setQueryData(
        queryKeys.aiSession.active(newSession.purpose),
        newSession
      );

      // 상세 캐시 설정
      queryClient.setQueryData(
        queryKeys.aiSession.detail(newSession.id),
        newSession
      );

      // 목록 캐시만 무효화 (active 쿼리는 setQueryData로 이미 설정됨)
      // all을 무효화하면 active도 refetch되어 setQueryData를 덮어쓰므로 list만 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiSession.lists(),
      });
    },
  });
}

/**
 * AI 세션 완료 Mutation
 *
 * @example
 * const completeSession = useCompleteAISession();
 * completeSession.mutate('session-id');
 */
export function useCompleteAISession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: conversationApi.completeAIConversation,

    onSuccess: (updatedConversation) => {
      // 상세 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.aiSession.detail(updatedConversation.id),
        updatedConversation
      );

      // 활성 세션 캐시 제거
      if (updatedConversation.aiPurpose) {
        queryClient.setQueryData(
          queryKeys.aiSession.active(updatedConversation.aiPurpose),
          null
        );
      }

      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiSession.all,
      });
    },
  });
}

/**
 * AI 세션 삭제 Mutation
 *
 * @example
 * const deleteSession = useDeleteAISession();
 * deleteSession.mutate('session-id');
 */
export function useDeleteAISession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: conversationApi.deleteConversation,

    onSuccess: (_, sessionId) => {
      // 상세 캐시 제거
      queryClient.removeQueries({
        queryKey: queryKeys.aiSession.detail(sessionId),
      });

      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiSession.all,
      });

      // 활성 세션 캐시 무효화 (삭제된 것이 활성이었을 수 있음)
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'aiSession' && query.queryKey[1] === 'active',
      });
    },
  });
}
