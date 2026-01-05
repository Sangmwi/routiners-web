'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { SessionPurpose } from '@/lib/types/routine';
import { AISessionCompat, Conversation } from '@/lib/types/chat';
import { conversationApi, ConversationListParams } from '@/lib/api/conversation';
import { queryKeys } from '@/lib/constants/queryKeys';

/**
 * AI Session Query Hooks (새 스키마 버전)
 *
 * conversations + chat_messages 테이블 사용
 * 기존 AISession 인터페이스와 호환 유지 (AISessionCompat)
 */

/**
 * AI 대화 목록 조회
 *
 * @param params - 필터 파라미터
 *
 * @example
 * const { data: sessions } = useAISessions({ aiPurpose: 'workout' });
 */
export function useAISessions(
  params: ConversationListParams = {},
  options?: Omit<UseQueryOptions<Conversation[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.aiSession.list(params),
    queryFn: () => conversationApi.getConversations({ type: 'ai', ...params }),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * 현재 활성 세션 조회
 *
 * @param purpose - 세션 목적 ('workout' | 'meal')
 *
 * @example
 * const { data: activeSession } = useActiveAISession('workout');
 */
export function useActiveAISession(
  purpose: SessionPurpose,
  options?: Omit<UseQueryOptions<AISessionCompat | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.aiSession.active(purpose),
    queryFn: () => conversationApi.getActiveAIConversation(purpose),
    staleTime: 30 * 1000, // 30초 (활성 세션은 자주 변경될 수 있음)
    ...options,
  });
}

/**
 * 특정 세션 상세 조회
 *
 * @param id - 세션 ID
 *
 * @example
 * const { data: session } = useAISession('session-id');
 */
export function useAISession(
  id: string | undefined,
  options?: Omit<UseQueryOptions<Conversation | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.aiSession.detail(id || ''),
    queryFn: () => conversationApi.getConversation(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
    ...options,
  });
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
      // 활성 세션 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.aiSession.active(newSession.purpose),
        newSession
      );

      // 상세 캐시 설정
      queryClient.setQueryData(
        queryKeys.aiSession.detail(newSession.id),
        newSession
      );

      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiSession.all,
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
 * AI 세션 포기 Mutation
 *
 * @example
 * const abandonSession = useAbandonAISession();
 * abandonSession.mutate('session-id');
 */
export function useAbandonAISession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: conversationApi.abandonAIConversation,

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
