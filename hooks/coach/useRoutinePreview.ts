'use client';

import { useState } from 'react';
import { useApplyRoutine, useClearActivePurpose } from './mutations';
import { useMessageStatusUpdate } from './useMessageStatusUpdate';
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
 * SOLID 원칙 적용:
 * - SRP: 루틴 프리뷰 드로어 관리만 담당
 * - DRY: 공통 메시지 상태 업데이트 훅 사용
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

  // 공통 메시지 상태 업데이트 훅 사용 (DRY)
  const { updateStatus } = useMessageStatusUpdate({
    conversationId,
    onError: refetchMessages,
  });

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
      await updateStatus(messageId, 'applied');

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
      await updateStatus(messageId, 'cancelled');

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
