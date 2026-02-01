'use client';

/**
 * Coach Message Sender Sub-Hook
 *
 * 메시지 전송 + SSE 스트리밍 관리
 * - 낙관적 메시지 생성
 * - AbortController 라이프사이클
 * - SSE 콜백 연결
 */

import { useRef, useEffect, type Dispatch } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { aiChatApi } from '@/lib/api/conversation';
import type { CoachChatState, CoachChatAction } from './helpers/coachReducer';
import { createCoachCallbacks } from './helpers/createCoachCallbacks';

// =============================================================================
// Types
// =============================================================================

interface UseCoachMessageSenderParams {
  conversationId: string | null;
  state: CoachChatState;
  dispatch: Dispatch<CoachChatAction>;
  queryClient: QueryClient;
  /** 스트리밍 완료 후 호출 (요약 체크용) */
  onStreamComplete?: (id: string) => void;
}

interface UseCoachMessageSenderReturn {
  /** 메시지 전송 (conversationId가 반드시 있어야 함) */
  sendMessage: (conversationId: string, content: string) => void;
  /** 스트리밍 취소 */
  cancelStream: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useCoachMessageSender({
  conversationId,
  dispatch,
  queryClient,
  onStreamComplete,
}: UseCoachMessageSenderParams): UseCoachMessageSenderReturn {
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = (conversationId: string, content: string) => {
    // 이전 스트림 취소
    abortControllerRef.current?.abort();

    // 낙관적 사용자 메시지 생성 + 스트리밍 시작
    dispatch({
      type: 'START_STREAMING',
      pendingMessage: {
        id: `pending-${Date.now()}`,
        conversationId,
        role: 'user',
        content: content.trim(),
        contentType: 'text',
        createdAt: new Date().toISOString(),
      },
    });

    // SSE 콜백 생성 + 스트리밍 시작
    const callbacks = createCoachCallbacks({
      conversationId,
      dispatch,
      queryClient,
      onStreamComplete,
    });

    abortControllerRef.current = aiChatApi.sendMessage(
      conversationId,
      content,
      callbacks
    );
  };

  const cancelStream = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    dispatch({ type: 'CANCEL_STREAM' });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { sendMessage, cancelStream };
}
