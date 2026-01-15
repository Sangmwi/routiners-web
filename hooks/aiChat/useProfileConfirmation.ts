'use client';

import { conversationApi } from '@/lib/api/conversation';
import type { ChatAction, ChatState } from './helpers/chatReducer';
import type { UseChatCacheSync } from './useChatCacheSync';
import type { SendMessageOptions } from './useMessageSender';

// =============================================================================
// Types
// =============================================================================

interface UseProfileConfirmationParams {
  sessionId: string | undefined;
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  cacheSync: UseChatCacheSync;
  sendMessage: (message: string, options?: SendMessageOptions) => void;
}

export interface UseProfileConfirmationReturn {
  /** 프로필 데이터 확인 */
  confirmProfile: () => void;
  /** 프로필 수정 요청 */
  requestProfileEdit: () => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * 프로필 확인 훅
 *
 * AI가 요청한 프로필 확인/수정 워크플로우 처리
 * - 로컬 상태 즉시 초기화 (UI 반응성)
 * - DB 메타데이터 클리어 (페이지 이탈 후 복귀 시 복원 방지)
 * - 컨텍스트 포함 메시지 전송
 */
export function useProfileConfirmation({
  sessionId,
  state,
  dispatch,
  cacheSync,
  sendMessage,
}: UseProfileConfirmationParams): UseProfileConfirmationReturn {
  // ---------------------------------------------------------------------------
  // 프로필 확인 / 수정 요청 (통합 핸들러)
  // ---------------------------------------------------------------------------

  const handleProfileResponse = async (isConfirmed: boolean) => {
    if (!sessionId || !state.pendingProfileConfirmation) return;

    // 필드 라벨 추출 (상태 클리어 전에)
    const labels = state.pendingProfileConfirmation.fields
      .map((f) => f.label)
      .join(', ');

    // 로컬 상태 즉시 초기화 (UI 반응성)
    dispatch({ type: 'CLEAR_PROFILE_CONFIRMATION' });

    // DB 메타데이터 즉시 클리어 (페이지 이탈 후 복귀 시 복원 방지)
    try {
      await conversationApi.clearProfileConfirmation(sessionId);
      cacheSync.syncProfileConfirmation(null);
    } catch (e) {
      console.error('[handleProfileResponse] Failed to clear metadata:', e);
    }

    // 컨텍스트 포함 메시지 전송
    const message = isConfirmed
      ? `[프로필 확인 완료] ${labels} 정보를 확인했습니다. 모두 정확합니다. 다음 단계로 진행해주세요.`
      : `[프로필 수정 요청] ${labels} 중에서 수정하고 싶은 정보가 있어요.`;
    sendMessage(message, {});
  };

  const confirmProfile = () => handleProfileResponse(true);
  const requestProfileEdit = () => handleProfileResponse(false);

  return {
    confirmProfile,
    requestProfileEdit,
  };
}
