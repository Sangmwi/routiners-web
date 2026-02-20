'use client';

/**
 * Counselor Profile Confirmation Sub-Hook
 *
 * Phase 9: 메시지 기반 트랜지언트 UI
 * - 프로필 확인 카드는 chat_messages 테이블에 저장됨
 * - 액션 시 메시지 상태만 업데이트 (confirmed | edited | cancelled)
 * - 카드는 히스토리에 영구 보존됨
 *
 * Phase 19: 3버튼 구조 (종료/수정/확인)
 * - cancelProfile 추가 (프로세스 종료)
 *
 * SOLID 원칙 적용:
 * - SRP: 프로필 확인/수정/종료 로직만 담당
 * - DRY: 공통 메시지 상태 업데이트 훅 사용
 */

import { useMessageStatusUpdate } from './useMessageStatusUpdate';
import { useClearActivePurpose } from './mutations';

// =============================================================================
// Types
// =============================================================================

interface UseCounselorProfileConfirmationParams {
  conversationId: string | null;
  /** 메시지 전송 함수 (conversationId, content) */
  sendMessage: (conversationId: string, content: string) => void;
  /** 메시지 refetch 함수 */
  refetchMessages: () => Promise<unknown>;
}

interface UseCounselorProfileConfirmationReturn {
  /** 프로필 데이터 확인 (messageId 기반) */
  confirmProfile: (messageId: string) => Promise<void>;
  /** 프로필 수정 요청 (messageId 기반) */
  editProfile: (messageId: string) => Promise<void>;
  /** 프로필 확인 프로세스 종료 (messageId 기반) */
  cancelProfile: (messageId: string) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

export function useCounselorProfileConfirmation({
  conversationId,
  sendMessage,
  refetchMessages,
}: UseCounselorProfileConfirmationParams): UseCounselorProfileConfirmationReturn {
  // 공통 메시지 상태 업데이트 훅 사용 (DRY)
  const { updateStatus } = useMessageStatusUpdate({
    conversationId,
    onError: refetchMessages,
  });

  // activePurpose 클리어 mutation
  const clearActivePurpose = useClearActivePurpose();

  /**
   * 프로필 확인 → 메시지 상태를 'confirmed'로 업데이트
   */
  const confirmProfile = async (messageId: string) => {
    if (!conversationId) return;

    try {
      await updateStatus(messageId, 'confirmed');

      // AI에게 진행 요청
      sendMessage(conversationId, '프로필 정보를 확인했어요. 다음 단계로 진행해주세요.');
    } catch (error) {
      console.error('[Profile Confirmation] Failed to confirm:', error);
      // 에러는 useMessageStatusUpdate에서 이미 처리됨 (롤백 포함)
    }
  };

  /**
   * 프로필 수정 요청 → 메시지 상태를 'edited'로 업데이트
   */
  const editProfile = async (messageId: string) => {
    if (!conversationId) return;

    try {
      await updateStatus(messageId, 'edited');

      // AI에게 수정 필요 메시지 전송 → AI가 "어떤 정보가 틀렸나요?" 물어봄
      sendMessage(conversationId, '정보가 정확하지 않아요. 수정이 필요해요.');
    } catch (error) {
      console.error('[Profile Confirmation] Failed to edit:', error);
      // 에러는 useMessageStatusUpdate에서 이미 처리됨 (롤백 포함)
    }
  };

  /**
   * 프로필 확인 프로세스 종료 → 메시지 상태를 'cancelled'로 업데이트
   * Phase 19: 3버튼 구조 추가
   */
  const cancelProfile = async (messageId: string) => {
    if (!conversationId) return;

    try {
      // 1. 메시지 상태 업데이트 (pending → cancelled)
      await updateStatus(messageId, 'cancelled');

      // 2. activePurpose 클리어
      await clearActivePurpose.mutateAsync(conversationId);

      // 3. AI에게 종료 메시지 전송
      sendMessage(conversationId, '프로필 확인을 종료할게요.');
    } catch (error) {
      console.error('[Profile Confirmation] Failed to cancel:', error);
    }
  };

  return { confirmProfile, editProfile, cancelProfile };
}
