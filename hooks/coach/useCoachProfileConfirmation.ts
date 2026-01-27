'use client';

/**
 * Coach Profile Confirmation Sub-Hook
 *
 * 프로필 데이터 확인/수정 핸들러
 * - 확인 → API 클리어 + 확인 메시지 전송
 * - 수정 → API 클리어 + 수정 요청 메시지 전송
 */

import type { Dispatch } from 'react';
import { conversationApi } from '@/lib/api/conversation';
import type { CoachChatState, CoachChatAction } from './helpers/coachReducer';

// =============================================================================
// Types
// =============================================================================

interface UseCoachProfileConfirmationParams {
  conversationId: string | null;
  state: CoachChatState;
  dispatch: Dispatch<CoachChatAction>;
  /** 메시지 전송 함수 (conversationId, content) */
  sendMessage: (conversationId: string, content: string) => void;
}

interface UseCoachProfileConfirmationReturn {
  /** 프로필 데이터 확인 */
  confirmProfile: () => void;
  /** 프로필 수정 요청 */
  requestProfileEdit: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useCoachProfileConfirmation({
  conversationId,
  state,
  dispatch,
  sendMessage,
}: UseCoachProfileConfirmationParams): UseCoachProfileConfirmationReturn {
  const confirmProfile = () => {
    if (!state.pendingProfileConfirmation || !conversationId) return;

    const labels = state.pendingProfileConfirmation.fields.map((f) => f.label).join(', ');
    dispatch({ type: 'CLEAR_PROFILE_CONFIRMATION' });
    conversationApi.clearProfileConfirmation(conversationId).catch(console.error);
    sendMessage(
      conversationId,
      `[프로필 확인 완료] ${labels} 정보를 확인했습니다. 모두 정확합니다. 다음 단계로 진행해주세요.`
    );
  };

  const requestProfileEdit = () => {
    if (!state.pendingProfileConfirmation || !conversationId) return;

    const labels = state.pendingProfileConfirmation.fields.map((f) => f.label).join(', ');
    dispatch({ type: 'CLEAR_PROFILE_CONFIRMATION' });
    conversationApi.clearProfileConfirmation(conversationId).catch(console.error);
    sendMessage(conversationId, `[프로필 수정 요청] ${labels} 중에서 수정하고 싶은 정보가 있어요.`);
  };

  return { confirmProfile, requestProfileEdit };
}
