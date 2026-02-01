'use client';

/**
 * Message Status Update Hook
 *
 * 메시지 상태 업데이트 공통 훅 (SRP)
 * - Optimistic update 패턴
 * - 서비스 호출
 * - 에러 처리 및 롤백
 */

import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import { MessageStatusService } from './services/messageStatusService';
import type { MessageStatus, UpdateMessageStatusParams } from './services/messageStatusService';
import type { CoachMessagePage } from '@/lib/types/coach';

interface UseMessageStatusUpdateOptions {
  conversationId: string | null;
  /** 에러 발생 시 메시지 refetch 함수 */
  onError?: () => Promise<unknown>;
}

interface UseMessageStatusUpdateReturn {
  /**
   * 메시지 상태 업데이트 (optimistic update 포함)
   */
  updateStatus: (
    messageId: string,
    status: MessageStatus,
    options?: { submittedValue?: string }
  ) => Promise<void>;
}

/**
 * 메시지 상태 업데이트 훅
 *
 * Optimistic update 패턴으로 즉시 UI 반영 후 서버 동기화
 */
export function useMessageStatusUpdate({
  conversationId,
  onError,
}: UseMessageStatusUpdateOptions): UseMessageStatusUpdateReturn {
  const queryClient = useQueryClient();

  const updateStatus = async (
    messageId: string,
    status: MessageStatus,
    options?: { submittedValue?: string }
  ): Promise<void> => {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

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
                      status: status as never,
                    },
                  }
                : msg
            ),
          })),
        };
      }
    );

    try {
      // 서버에 상태 업데이트 요청
      const params: UpdateMessageStatusParams = {
        conversationId,
        messageId,
        status,
        ...(options?.submittedValue !== undefined && {
          submittedValue: options.submittedValue,
        }),
      };

      await MessageStatusService.updateStatus(params);

      // 성공 시 optimistic update가 이미 올바른 상태이므로 refetch 불필요
    } catch (error) {
      // 실패 시 롤백: refetch로 서버 상태로 복원
      if (onError) {
        await onError();
      } else {
        // 기본 롤백: 메시지 쿼리 invalidate
        await queryClient.invalidateQueries({
          queryKey: queryKeys.coach.messages(conversationId),
        });
      }

      console.error('[Message Status Update] Failed:', error);
      throw error;
    }
  };

  return { updateStatus };
}
