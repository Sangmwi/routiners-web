'use client';

/**
 * Coach Preview Actions Sub-Hook
 *
 * 루틴 프리뷰 적용/수정 요청
 * AI에게 메시지를 전송하여 서버에서 처리
 */

// =============================================================================
// Types
// =============================================================================

interface UseCoachPreviewActionsParams {
  /** 메시지 전송 함수 (conversationId, content) */
  sendMessage: (conversationId: string, content: string) => void;
}

interface UseCoachPreviewActionsReturn {
  /** 루틴 적용 (forceOverwrite: 충돌 시 덮어쓰기) */
  applyRoutine: (conversationId: string, forceOverwrite?: boolean) => void;
  /** 수정 요청 */
  requestRevision: (conversationId: string, feedback: string) => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useCoachPreviewActions({
  sendMessage,
}: UseCoachPreviewActionsParams): UseCoachPreviewActionsReturn {
  const applyRoutine = (conversationId: string, forceOverwrite?: boolean) => {
    const message = forceOverwrite
      ? '루틴을 덮어쓰기로 적용해주세요'
      : '루틴을 적용해주세요';
    sendMessage(conversationId, message);
  };

  const requestRevision = (conversationId: string, feedback: string) => {
    sendMessage(conversationId, `수정 요청: ${feedback}`);
  };

  return { applyRoutine, requestRevision };
}
