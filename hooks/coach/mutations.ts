'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import { coachApi, coachPurposeApi, coachContextApi } from '@/lib/api/coach';
import { api } from '@/lib/api/client';
import { invalidateAfterRoutineApply } from '@/lib/utils/routineEventCacheHelper';
import type {
  CoachConversation,
  CoachConversationsResponse,
  CoachConversationListItem,
  CreateCoachConversationData,
  UpdateActivePurposeData,
} from '@/lib/types/coach';

// ============================================================================
// Conversation Mutations
// ============================================================================

/**
 * 새 코치 대화 생성
 *
 * @example
 * const createConversation = useCreateCoachConversation();
 *
 * const newConversation = await createConversation.mutateAsync({
 *   activePurpose: { type: 'routine_generation', stage: 'init', collectedData: {} }
 * });
 */
export function useCreateCoachConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: CreateCoachConversationData) => coachApi.createConversation(data),

    onSuccess: (newConversation) => {
      // 대화 목록에 새 대화 추가
      queryClient.setQueryData<CoachConversationsResponse>(
        queryKeys.coach.conversations(),
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

          const newItem: CoachConversationListItem = {
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
        queryKeys.coach.activeConversation(),
        newConversation
      );
    },
  });
}

/**
 * 코치 대화 삭제
 */
export function useDeleteCoachConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => coachApi.deleteConversation(conversationId),

    onSuccess: (_, conversationId) => {
      // 대화 목록에서 제거
      queryClient.setQueryData<CoachConversationsResponse>(
        queryKeys.coach.conversations(),
        (old) => {
          if (!old) return old;

          const wasActive = old.activeConversationId === conversationId;

          // 활성 대화였으면 activeConversation 캐시도 클리어
          if (wasActive) {
            queryClient.setQueryData(queryKeys.coach.activeConversation(), null);
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
        queryKey: queryKeys.coach.conversation(conversationId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.coach.messages(conversationId),
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
      weekCount?: number; // Phase 11: 적용할 주차 수
    }) =>
      api.post<{ previewId: string; eventsCreated: number; startDate: string }>(
        '/api/routine/apply',
        params
      ),

    onSuccess: (_, { conversationId }) => {
      // 대화 + 루틴 이벤트 + AI 세션 캐시 무효화
      invalidateAfterRoutineApply(queryClient, conversationId);
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
    }) => coachPurposeApi.setActivePurpose(conversationId, data),

    onSuccess: (updated, { conversationId }) => {
      // 대화 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.coach.conversation(conversationId),
        updated
      );

      // 대화 목록 업데이트
      queryClient.setQueryData<CoachConversationsResponse>(
        queryKeys.coach.conversations(),
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
      coachPurposeApi.clearActivePurpose(conversationId),

    onSuccess: (updated, conversationId) => {
      // 대화 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.coach.conversation(conversationId),
        updated
      );

      // 대화 목록 업데이트
      queryClient.setQueryData<CoachConversationsResponse>(
        queryKeys.coach.conversations(),
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
      coachContextApi.triggerSummarization(conversationId),

    onSuccess: (_, conversationId) => {
      // 대화 정보 새로고침
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.conversation(conversationId),
      });
    },
  });
}
