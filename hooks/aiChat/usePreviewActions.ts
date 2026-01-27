'use client';

import type { ChatAction, ChatState } from './helpers/chatReducer';
import type { UseChatCacheSync } from './useChatCacheSync';
import type { SendMessageOptions } from './useMessageSender';
import { applyPreview } from './helpers/applyPreview';

// =============================================================================
// Types
// =============================================================================

interface UsePreviewActionsParams {
  sessionId: string | undefined;
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  cacheSync: UseChatCacheSync;
  sendMessage: (message: string, options?: SendMessageOptions) => void;
}

export interface UsePreviewActionsReturn {
  /** 루틴 미리보기 적용 */
  applyRoutine: (forceOverwrite?: boolean) => void;
  /** 루틴 수정 요청 */
  requestRevision: (feedback: string) => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * 미리보기 액션 훅
 *
 * 루틴 미리보기 적용 및 수정 요청 처리
 * - 충돌 시 덮어쓰기 옵션 지원
 * - 수정 요청 시 피드백 메시지 전송
 */
export function usePreviewActions({
  sessionId,
  state,
  dispatch,
  cacheSync,
  sendMessage,
}: UsePreviewActionsParams): UsePreviewActionsReturn {
  // ---------------------------------------------------------------------------
  // 루틴 미리보기 적용 / 수정 요청
  // ---------------------------------------------------------------------------

  const applyRoutine = (forceOverwrite?: boolean) => {
    if (!sessionId || !state.pendingRoutinePreview) return;
    applyPreview('routine', sessionId, state.pendingRoutinePreview.id, dispatch, cacheSync, forceOverwrite);
  };

  const requestRevision = (feedback: string) => {
    if (!sessionId || !state.pendingRoutinePreview) return;
    dispatch({ type: 'CLEAR_ROUTINE_PREVIEW' });
    sendMessage(feedback, {});
  };

  return {
    applyRoutine,
    requestRevision,
  };
}
