'use client';

/**
 * Routine Preview Management Hook
 *
 * Phase 10: 루틴 적용/취소 AI 대화 흐름
 * - 상태 업데이트 + 실제 API 호출 + AI 메시지 전송
 * - AI가 대화 맥락을 유지할 수 있도록 메시지로 알림
 * - 프로필 확인 패턴과 동일한 구조
 *
 * Phase 19: 3버튼 구조 (종료/수정/적용)
 * - edit 함수 추가 (루틴 수정 요청)
 *
 * SOLID 원칙 적용:
 * - SRP: 루틴 프리뷰 관리만 담당
 * - DRY: 공통 메시지 상태 업데이트 훅 사용
 */

import { useState } from 'react';
import { useApplyRoutine, useClearActivePurpose } from './mutations';
import { useMessageStatusUpdate } from './useMessageStatusUpdate';
import type { RoutinePreviewData } from '@/lib/types/fitness';

// =============================================================================
// Types
// =============================================================================

interface UseRoutinePreviewOptions {
  /** 현재 대화 ID */
  conversationId: string | null;
  /** 메시지 전송 함수 (conversationId, content) - AI 대화 맥락 유지용 */
  sendMessage: (conversationId: string, content: string) => void;
  /** 메시지 refetch 함수 (상태 업데이트 후 UI 갱신용) */
  refetchMessages: () => Promise<unknown>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * 루틴 프리뷰 드로어 관리 훅 (SRP)
 *
 * Phase 10: 상태 업데이트 + API 호출 + AI 메시지
 * Phase 19: 3버튼 구조 (종료/수정/적용)
 * - 적용: updateStatus('applied') → applyRoutine API → AI 메시지
 * - 수정: updateStatus('edited') → AI 메시지 (뭘 수정할지 물어봄)
 * - 종료: updateStatus('cancelled') → clearActivePurpose API → AI 메시지
 * - 대화 히스토리에 전체 맥락이 남음
 *
 * 책임:
 * - 프리뷰 드로어 열림/닫힘 상태
 * - 루틴 적용/수정/종료 (상태 + API + 메시지)
 */
export function useRoutinePreview({
  conversationId,
  sendMessage,
  refetchMessages,
}: UseRoutinePreviewOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPreviewMessageId, setCurrentPreviewMessageId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Mutations
  const applyRoutine = useApplyRoutine();
  const clearActivePurpose = useClearActivePurpose();

  // 공통 메시지 상태 업데이트 훅 (DRY)
  const { updateStatus } = useMessageStatusUpdate({
    conversationId,
    onError: refetchMessages,
  });

  const open = (messageId?: string) => {
    if (messageId) setCurrentPreviewMessageId(messageId);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setCurrentPreviewMessageId(null);
  };

  /**
   * 루틴 적용
   *
   * Phase 10: 상태 업데이트 + API 호출 + AI 메시지
   * Phase 11: weekCount 파라미터 추가
   *
   * 1. 메시지 상태를 'applied'로 업데이트
   * 2. applyRoutine API 호출 (실제 DB 저장)
   * 3. AI에게 메시지 전송 (대화 맥락 유지)
   *
   * @param messageId 루틴 미리보기 메시지 ID
   * @param previewData 메시지에서 파싱된 프리뷰 데이터
   * @param forceOverwrite 충돌 시 덮어쓰기 여부
   * @param weekCount 적용할 주차 수 (Phase 11)
   * @param appendMode 이어붙이기 모드 (기존 스케줄 유지, 이후부터 시작)
   */
  const apply = async (
    messageId: string,
    previewData: RoutinePreviewData,
    forceOverwrite?: boolean,
    weekCount?: number,
    appendMode?: boolean
  ) => {
    if (!conversationId || !previewData?.id) return;

    setIsApplying(true);
    try {
      // 1. 루틴 적용 API 호출
      await applyRoutine.mutateAsync({
        conversationId,
        previewId: previewData.id,
        forceOverwrite,
        weekCount,
        appendMode,
      });

      // 2. 메시지 상태 업데이트 (pending → applied)
      await updateStatus(messageId, 'applied');

      // 3. AI 액션 메시지 제거 — REST API가 이미 루틴 적용 완료.
      //    action message 전송 시 AI streaming이 트리거되어
      //    고스트 로딩 + 빈 AI 응답이 발생하므로 제거.
      //    다음 사용자 메시지에서 AI가 대화 히스토리를 통해 적용 사실 인지 가능.

      close();
    } catch (error) {
      console.error('[Routine Preview] Failed to apply:', error);
      // 에러 시 롤백은 useMessageStatusUpdate에서 처리
    } finally {
      setIsApplying(false);
    }
  };

  /**
   * 루틴 수정 요청
   *
   * Phase 19: 3버튼 구조 추가
   * 1. 메시지 상태를 'edited'로 업데이트
   * 2. AI에게 수정 요청 메시지 전송 (AI가 뭘 수정할지 물어봄)
   *
   * @param messageId 루틴 미리보기 메시지 ID
   */
  const edit = async (messageId: string) => {
    if (!conversationId) return;

    try {
      // 1. 메시지 상태 업데이트 (pending → edited)
      await updateStatus(messageId, 'edited');

      // 2. AI에게 수정 요청 메시지 전송
      sendMessage(conversationId, '루틴을 수정하고 싶어요.');

      close();
    } catch (error) {
      console.error('[Routine Preview] Failed to edit:', error);
    }
  };

  /**
   * 루틴 생성 프로세스 종료
   *
   * Phase 10: 상태 업데이트 + API 호출 + AI 메시지
   * Phase 19: 취소 → 종료로 명칭 변경
   * 1. 메시지 상태를 'cancelled'로 업데이트
   * 2. clearActivePurpose API 호출
   * 3. AI에게 메시지 전송 (대화 맥락 유지)
   *
   * @param messageId 루틴 미리보기 메시지 ID
   */
  const cancel = async (messageId: string) => {
    if (!conversationId) return;

    try {
      // 1. 메시지 상태 업데이트 (pending → cancelled)
      await updateStatus(messageId, 'cancelled');

      // 2. activePurpose 클리어 API 호출
      await clearActivePurpose.mutateAsync(conversationId);

      // 3. AI에게 메시지 전송 (대화 맥락 유지)
      sendMessage(conversationId, '루틴 생성을 취소했어요.');

      close();
    } catch (error) {
      console.error('[Routine Preview] Failed to cancel:', error);
      // 에러 시 롤백은 useMessageStatusUpdate에서 처리
    }
  };

  return {
    isOpen,
    currentPreviewMessageId,
    isApplying,
    open,
    close,
    apply,
    edit,
    cancel,
  };
}
