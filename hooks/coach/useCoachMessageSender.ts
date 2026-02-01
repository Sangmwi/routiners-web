'use client';

/**
 * Coach Message Sender Sub-Hook
 *
 * 메시지 전송 + SSE 스트리밍 관리
 *
 * Phase 13: onMutate 패턴 전환
 * - flushSync 제거: React Query 캐시가 동기적으로 업데이트됨
 * - useSendCoachMessage로 낙관적 업데이트 처리
 * - AbortController 라이프사이클 유지
 */

import { useRef, useEffect, type Dispatch } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { CoachChatAction } from './helpers/coachReducer';
import { createCoachCallbacks } from './helpers/createCoachCallbacks';
import { useSendCoachMessage, removeOptimisticMessages } from './useSendCoachMessage';

// =============================================================================
// Types
// =============================================================================

interface UseCoachMessageSenderParams {
  conversationId: string | null;
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
  const sendCoachMessage = useSendCoachMessage();

  const sendMessage = (convId: string, content: string) => {
    // 이전 스트림 취소
    abortControllerRef.current?.abort();

    // 스트리밍 상태 시작 (낙관적 메시지는 mutation의 onMutate에서 처리)
    dispatch({ type: 'START_STREAMING' });

    // SSE 콜백 생성
    const callbacks = createCoachCallbacks({
      conversationId: convId,
      dispatch,
      queryClient,
      onStreamComplete,
    });

    // 뮤테이션 실행 (onMutate에서 낙관적 메시지 삽입)
    sendCoachMessage.mutate(
      { conversationId: convId, content, callbacks },
      {
        onSuccess: (controller) => {
          abortControllerRef.current = controller;
        },
        onError: () => {
          // 오류 시 optimistic 메시지는 mutation의 onError에서 처리됨
          abortControllerRef.current = null;
        },
      }
    );
  };

  const cancelStream = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    // optimistic 메시지 제거
    if (conversationId) {
      removeOptimisticMessages(queryClient, conversationId);
    }
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
