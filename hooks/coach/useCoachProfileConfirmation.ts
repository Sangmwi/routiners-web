'use client';

/**
 * Coach Profile Confirmation Sub-Hook
 *
 * Phase 9: 메시지 기반 트랜지언트 UI
 * - 프로필 확인 카드는 chat_messages 테이블에 저장됨
 * - 액션 시 메시지 상태만 업데이트 (confirmed | edited)
 * - 카드는 히스토리에 영구 보존됨
 */

import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import type { ChatMessage } from '@/lib/types/chat';
import type { CoachMessagePage } from '@/lib/types/coach';

// =============================================================================
// Types
// =============================================================================

interface UseCoachProfileConfirmationParams {
  conversationId: string | null;
  /** 메시지 전송 함수 (conversationId, content) */
  sendMessage: (conversationId: string, content: string) => void;
  /** 메시지 refetch 함수 */
  refetchMessages: () => Promise<unknown>;
}

interface UseCoachProfileConfirmationReturn {
  /** 프로필 데이터 확인 (messageId 기반) */
  confirmProfile: (messageId: string) => Promise<void>;
  /** 프로필 수정 요청 (messageId 기반) */
  editProfile: (messageId: string) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

export function useCoachProfileConfirmation({
  conversationId,
  sendMessage,
  refetchMessages,
}: UseCoachProfileConfirmationParams): UseCoachProfileConfirmationReturn {
  const queryClient = useQueryClient();

  /**
   * 프로필 확인 → 메시지 상태를 'confirmed'로 업데이트
   */
  const confirmProfile = async (messageId: string) => {
    if (!conversationId) return;

    try {
      // Optimistic update: 로컬 캐시 먼저 업데이트
      queryClient.setQueryData<{ pages: CoachMessagePage[]; pageParams: unknown[] }>(
        queryKeys.coach.messages(conversationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      metadata: {
                        ...msg.metadata,
                        status: 'confirmed' as const,
                      },
                    }
                  : msg
              ),
            })),
          };
        }
      );

      // 메시지 상태 업데이트 (pending → confirmed)
      const response = await fetch(
        `/api/coach/conversations/${conversationId}/messages/${messageId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'confirmed' }),
        }
      );

      if (!response.ok) {
        // 실패 시 롤백
        await refetchMessages();
        const errorText = await response.text();
        console.error('[Profile Confirmation] API Error:', response.status, errorText);
        throw new Error('Failed to update message status');
      }

      // Optimistic Update를 사용하므로 refetch 불필요
      // (성공 시에는 로컬 캐시가 이미 올바른 상태이므로)

      // AI에게 진행 요청
      sendMessage(conversationId, '프로필 정보를 확인했습니다. 다음 단계로 진행해주세요.');
    } catch (error) {
      // 에러 시 롤백
      await refetchMessages();
      console.error('[Profile Confirmation] Failed to confirm:', error);
    }
  };

  /**
   * 프로필 수정 요청 → 메시지 상태를 'edited'로 업데이트
   */
  const editProfile = async (messageId: string) => {
    if (!conversationId) return;

    try {
      // Optimistic update: 로컬 캐시 먼저 업데이트
      queryClient.setQueryData<{ pages: CoachMessagePage[]; pageParams: unknown[] }>(
        queryKeys.coach.messages(conversationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      metadata: {
                        ...msg.metadata,
                        status: 'edited' as const,
                      },
                    }
                  : msg
              ),
            })),
          };
        }
      );

      // 메시지 상태 업데이트 (pending → edited)
      const response = await fetch(
        `/api/coach/conversations/${conversationId}/messages/${messageId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'edited' }),
        }
      );

      if (!response.ok) {
        // 실패 시 롤백
        await refetchMessages();
        const errorText = await response.text();
        console.error('[Profile Edit] API Error:', response.status, errorText);
        throw new Error('Failed to update message status');
      }

      // Optimistic Update를 사용하므로 refetch 불필요
      // (성공 시에는 로컬 캐시가 이미 올바른 상태이므로)

      // AI에게 수정 필요 메시지 전송 → AI가 "어떤 정보가 틀렸나요?" 물어봄
      sendMessage(conversationId, '정보가 정확하지 않아요. 수정이 필요합니다.');
    } catch (error) {
      // 에러 시 롤백
      await refetchMessages();
      console.error('[Profile Confirmation] Failed to edit:', error);
    }
  };

  return { confirmProfile, editProfile };
}
