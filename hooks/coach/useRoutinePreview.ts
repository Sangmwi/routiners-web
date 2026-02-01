'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApplyRoutine, useClearActivePurpose } from './mutations';
import { queryKeys } from '@/lib/constants/queryKeys';
import type { RoutinePreviewData } from '@/lib/types/fitness';

interface UseRoutinePreviewOptions {
  /** 현재 대화 ID */
  conversationId: string | null;
  /** 메시지 refetch 함수 */
  refetchMessages: () => Promise<unknown>;
}

/**
 * 루틴 프리뷰 드로어 관리 훅 (SRP)
 *
 * Phase 9: 메시지 기반 트랜지언트 UI
 * - 루틴 미리보기 카드는 chat_messages 테이블에 저장됨
 * - 액션 시 메시지 상태만 업데이트 (applied | cancelled)
 * - 카드는 히스토리에 영구 보존됨
 *
 * 책임:
 * - 프리뷰 드로어 열림/닫힘 상태
 * - 루틴 적용 처리 (isApplying 상태 포함)
 * - 루틴 생성 프로세스 취소
 */
export function useRoutinePreview({
  conversationId,
  refetchMessages,
}: UseRoutinePreviewOptions) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [currentPreviewMessageId, setCurrentPreviewMessageId] = useState<string | null>(null);
  const applyRoutine = useApplyRoutine();
  const clearActivePurpose = useClearActivePurpose();

  const open = (messageId?: string) => {
    if (messageId) setCurrentPreviewMessageId(messageId);
    setIsOpen(true);
  };
  const close = () => {
    setIsOpen(false);
    setCurrentPreviewMessageId(null);
  };

  /**
   * 메시지 상태 업데이트 헬퍼
   */
  const updateMessageStatus = async (messageId: string, status: 'applied' | 'cancelled') => {
    if (!conversationId) return;

    const response = await fetch(
      `/api/coach/conversations/${conversationId}/messages/${messageId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update message status');
    }

    // 메시지 목록 즉시 refetch (상태 반영)
    await refetchMessages();
  };

  /**
   * 루틴 적용 (messageId 기반)
   * @param messageId 루틴 미리보기 메시지 ID
   * @param previewData 메시지에서 파싱된 프리뷰 데이터
   * @param forceOverwrite 충돌 시 덮어쓰기 여부
   */
  const apply = async (
    messageId: string,
    previewData: RoutinePreviewData,
    forceOverwrite?: boolean
  ) => {
    if (!conversationId || !previewData?.id) return;

    setIsApplying(true);
    try {
      await applyRoutine.mutateAsync({
        conversationId,
        previewId: previewData.id,
        forceOverwrite,
      });

      // 메시지 상태 업데이트 (pending → applied)
      await updateMessageStatus(messageId, 'applied');

      close();
    } catch (error) {
      console.error('[Routine Preview] Failed to apply:', error);
      throw error;
    } finally {
      setIsApplying(false);
    }
  };

  /**
   * 루틴 생성 프로세스 취소 (messageId 기반)
   * @param messageId 루틴 미리보기 메시지 ID
   */
  const cancel = async (messageId: string) => {
    if (!conversationId) return;

    setIsCanceling(true);
    try {
      // activePurpose 해제
      await clearActivePurpose.mutateAsync(conversationId);

      // 메시지 상태 업데이트 (pending → cancelled)
      await updateMessageStatus(messageId, 'cancelled');

      close();
    } catch (error) {
      console.error('[Routine Preview] Failed to cancel:', error);
    } finally {
      setIsCanceling(false);
    }
  };

  return {
    isOpen,
    isApplying,
    isCanceling,
    currentPreviewMessageId,
    open,
    close,
    apply,
    cancel,
  };
}
