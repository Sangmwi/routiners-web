/**
 * Coach Chat SSE Callback Factory
 *
 * SSE 스트리밍 콜백을 생성하여 리듀서와 연결
 *
 * Phase 13: 낙관적 업데이트 개선
 * - invalidateAll → 단일 refetchQueries
 * - 중복 refetch 제거 (onComplete에서만 1회)
 * - optimistic 메시지는 refetch로 자동 교체
 */

import type { Dispatch } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { AIToolName } from '@/lib/types/fitness';
import type { ChatStreamCallbacks } from '@/lib/api/conversation';
import type { CoachChatAction } from './coachReducer';
import { queryKeys } from '@/lib/constants/queryKeys';
import { removeOptimisticMessages } from '../useSendCoachMessage';

// =============================================================================
// Types
// =============================================================================

export interface CoachCallbackContext {
  conversationId: string;
  dispatch: Dispatch<CoachChatAction>;
  queryClient: QueryClient;
  /** 스트리밍 완료 후 호출 (요약 체크 등) */
  onStreamComplete?: (conversationId: string) => void;
}

// =============================================================================
// Factory
// =============================================================================

/**
 * 코치 채팅 콜백 생성
 *
 * Phase 13: 낙관적 업데이트 개선
 * - 단일 refetch로 통합 (onComplete에서만)
 * - 이벤트 핸들러에서 중복 refetch 제거
 * - optimistic 메시지는 refetch로 자동 교체
 */
export function createCoachCallbacks(ctx: CoachCallbackContext): ChatStreamCallbacks {
  const { dispatch, queryClient, conversationId, onStreamComplete } = ctx;

  // 메시지 + 대화 캐시 동시 갱신 (단일 호출)
  const refreshCache = async () => {
    await Promise.all([
      queryClient.refetchQueries({
        queryKey: queryKeys.coach.messages(conversationId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.coach.conversation(conversationId),
      }),
    ]);
  };

  return {
    onMessage: (chunk) => {
      dispatch({ type: 'APPEND_STREAMING', chunk });
    },

    onComplete: async () => {
      dispatch({ type: 'COMPLETE_STREAMING' });

      // 서버 메시지 반영 (optimistic 메시지가 실제 메시지로 교체됨)
      await refreshCache();

      // 스트리밍 플레이스홀더 제거
      dispatch({ type: 'CLEAR_STREAMING_CONTENT' });

      // 요약 체크 (non-blocking)
      onStreamComplete?.(conversationId);
    },

    onError: (err) => {
      // 오류 시 optimistic 메시지 제거
      removeOptimisticMessages(queryClient, conversationId);
      dispatch({ type: 'SET_ERROR', error: err.message });
    },

    onToolStart: (event) => {
      dispatch({
        type: 'TOOL_START',
        toolCallId: event.toolCallId,
        name: event.name as AIToolName,
      });
    },

    onToolDone: (event) => {
      dispatch({
        type: 'TOOL_DONE',
        toolCallId: event.toolCallId,
        success: event.success ?? true,
      });
    },

    // Phase 13: 이벤트별 refetch 제거
    // → onComplete에서 통합 refetch하므로 개별 refetch 불필요
    // → 서버에서 메시지로 저장 후 onComplete의 refreshCache에서 반영
    onInputRequest: () => {
      // No-op: onComplete에서 처리
    },

    onRoutinePreview: () => {
      // 루틴 생성 완료 → 프로그래스바 제거
      dispatch({ type: 'CLEAR_ROUTINE_PROGRESS' });
      // No-op for refetch: onComplete에서 처리
    },

    onProfileConfirmation: () => {
      // No-op: onComplete에서 처리
    },

    onRoutineApplied: (event) => {
      dispatch({ type: 'SET_APPLIED_ROUTINE', event });
    },

    onRoutineProgress: (event) => {
      dispatch({ type: 'SET_ROUTINE_PROGRESS', event });
    },
  };
}
