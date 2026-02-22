'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import { counselorApi, counselorPurposeApi, counselorContextApi } from '@/lib/api/counselor';
import { api } from '@/lib/api/client';
import { invalidateAfterRoutineApply } from '@/lib/utils/routineEventCacheHelper';
import type {
  CounselorConversationsResponse,
  CounselorConversationListItem,
  CreateCounselorConversationData,
  UpdateActivePurposeData,
} from '@/lib/types/counselor';

// ============================================================================
// Conversation Mutations
// ============================================================================

/**
 * 새 상담 대화 생성
 *
 * @example
 * const createConversation = useCreateCounselorConversation();
 *
 * const newConversation = await createConversation.mutateAsync({
 *   activePurpose: { type: 'routine_generation', stage: 'init', collectedData: {} }
 * });
 */
export function useCreateCounselorConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: CreateCounselorConversationData) => counselorApi.createConversation(data),

    onSuccess: (newConversation) => {
      // 대화 목록에 새 대화 추가
      queryClient.setQueryData<CounselorConversationsResponse>(
        queryKeys.counselor.conversations(),
        (old) => {
          if (!old) {
            return {
              conversations: [
                {
                  conversation: newConversation,
                  hasActivePurpose: !!newConversation.metadata?.activePurpose,
                },
              ],
              activeConversationId: newConversation.id,
            };
          }

          const newItem: CounselorConversationListItem = {
            conversation: newConversation,
            hasActivePurpose: !!newConversation.metadata?.activePurpose,
          };

          return {
            conversations: [newItem, ...old.conversations],
            activeConversationId: newConversation.id,
          };
        }
      );

      // 활성 대화 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.counselor.activeConversation(),
        newConversation
      );
    },
  });
}

/**
 * 상담 대화 삭제
 */
export function useDeleteCounselorConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => counselorApi.deleteConversation(conversationId),

    onSuccess: (_, conversationId) => {
      // 대화 목록에서 제거
      queryClient.setQueryData<CounselorConversationsResponse>(
        queryKeys.counselor.conversations(),
        (old) => {
          if (!old) return old;

          const wasActive = old.activeConversationId === conversationId;

          // 활성 대화였으면 activeConversation 캐시도 클리어
          if (wasActive) {
            queryClient.setQueryData(queryKeys.counselor.activeConversation(), null);
          }

          return {
            ...old,
            conversations: old.conversations.filter(
              (item) => item.conversation.id !== conversationId
            ),
            activeConversationId: wasActive ? undefined : old.activeConversationId,
          };
        }
      );

      // 개별 캐시 제거
      queryClient.removeQueries({
        queryKey: queryKeys.counselor.conversation(conversationId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.counselor.messages(conversationId),
      });
    },
  });
}

// ============================================================================
// Routine Apply Mutation
// ============================================================================

/**
 * 루틴 적용 (AI 미경유, REST API 직접 호출)
 *
 * conversation.metadata.pending_preview 데이터를 DB에 저장
 * forceOverwrite 시 겹치는 날짜의 기존 루틴 삭제 후 적용
 *
 * Phase 11: weekCount 파라미터 추가 - 사용자가 선택한 주차 수만큼 적용
 */
export function useApplyRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      conversationId: string;
      previewId: string;
      forceOverwrite?: boolean;
      weekCount?: number;
      appendMode?: boolean;
    }) =>
      api.post<{
        previewId: string;
        eventsCreated: number;
        eventsPreserved: number;
        startDate: string;
        isReapply: boolean;
      }>(
        '/api/routine/apply',
        params
      ),

    onSuccess: (_, { conversationId }) => {
      // 대화 + 루틴 이벤트 + AI 세션 캐시 무효화
      invalidateAfterRoutineApply(queryClient, conversationId);

      // 대화 목록에서 activePurpose 즉시 제거 (서버 refetch 전 UI 반영)
      queryClient.setQueryData<CounselorConversationsResponse>(
        queryKeys.counselor.conversations(),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            conversations: old.conversations.map((item) =>
              item.conversation.id === conversationId
                ? { ...item, hasActivePurpose: false }
                : item
            ),
          };
        }
      );
    },
  });
}

// ============================================================================
// Meal Plan Apply Mutation
// ============================================================================

/**
 * 식단 적용 (AI 미경유, REST API 직접 호출)
 */
export function useApplyMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      conversationId: string;
      previewId: string;
    }) =>
      api.post<{
        previewId: string;
        eventsCreated: number;
        startDate: string;
      }>(
        '/api/routine/apply-meal',
        params
      ),

    onSuccess: (_, { conversationId }) => {
      invalidateAfterRoutineApply(queryClient, conversationId);

      queryClient.setQueryData<CounselorConversationsResponse>(
        queryKeys.counselor.conversations(),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            conversations: old.conversations.map((item) =>
              item.conversation.id === conversationId
                ? { ...item, hasActivePurpose: false }
                : item
            ),
          };
        }
      );
    },
  });
}

// ============================================================================
// Active Purpose Mutations
// ============================================================================

/**
 * 활성 목적 설정
 *
 * @example
 * const setActivePurpose = useSetActivePurpose();
 *
 * await setActivePurpose.mutateAsync({
 *   conversationId: 'xxx',
 *   data: {
 *     activePurpose: { type: 'routine_generation', stage: 'init', collectedData: {} }
 *   }
 * });
 */
export function useSetActivePurpose() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: UpdateActivePurposeData;
    }) => counselorPurposeApi.setActivePurpose(conversationId, data),

    onSuccess: (updated, { conversationId }) => {
      // 대화 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.counselor.conversation(conversationId),
        updated
      );

      // 대화 목록 업데이트
      queryClient.setQueryData<CounselorConversationsResponse>(
        queryKeys.counselor.conversations(),
        (old) => {
          if (!old) return old;

          return {
            ...old,
            conversations: old.conversations.map((item) =>
              item.conversation.id === conversationId
                ? {
                    ...item,
                    conversation: updated,
                    hasActivePurpose: !!updated.metadata?.activePurpose,
                  }
                : item
            ),
          };
        }
      );
    },
  });
}

/**
 * 활성 목적 해제
 */
export function useClearActivePurpose() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      counselorPurposeApi.clearActivePurpose(conversationId),

    onSuccess: (updated, conversationId) => {
      // 대화 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.counselor.conversation(conversationId),
        updated
      );

      // 대화 목록 업데이트
      queryClient.setQueryData<CounselorConversationsResponse>(
        queryKeys.counselor.conversations(),
        (old) => {
          if (!old) return old;

          return {
            ...old,
            conversations: old.conversations.map((item) =>
              item.conversation.id === conversationId
                ? { ...item, conversation: updated, hasActivePurpose: false }
                : item
            ),
          };
        }
      );
    },
  });
}

// ============================================================================
// Context Summarization Mutations
// ============================================================================

/**
 * 컨텍스트 요약 트리거
 */
export function useTriggerSummarization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      counselorContextApi.triggerSummarization(conversationId),

    onSuccess: (_, conversationId) => {
      // 대화 정보 새로고침
      queryClient.invalidateQueries({
        queryKey: queryKeys.counselor.conversation(conversationId),
      });
    },
  });
}
