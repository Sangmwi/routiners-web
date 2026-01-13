/**
 * Chat Callbacks Builder
 *
 * sendMessageCore에서 사용하는 SSE 콜백 객체를 생성
 * P3: useReducer 기반 dispatch 사용으로 상태 업데이트 명확화
 */

import type { Dispatch, MutableRefObject } from 'react';
import type {
  ChatStreamCallbacks,
  ToolEvent,
  RoutineAppliedEvent,
  RoutineProgressEvent,
  MealPlanAppliedEvent,
  MealPlanProgressEvent,
} from '@/lib/api/conversation';
import type { ChatMessage, ProfileConfirmationRequest } from '@/lib/types/chat';
import type { InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
import type { MealPlanPreviewData } from '@/lib/types/meal';
import { AI_CHAT_TIMING } from '@/lib/constants/aiChat';
import type { useChatCacheSync } from '../useChatCacheSync';
import type { ChatAction } from './chatReducer';

// =============================================================================
// Types
// =============================================================================

type CacheSync = ReturnType<typeof useChatCacheSync>;

/**
 * 콜백 빌더에 필요한 컨텍스트
 */
export interface CallbackBuilderContext {
  /** 세션 ID */
  sessionId: string;
  /** 상태 업데이터 (dispatch) */
  dispatch: Dispatch<ChatAction>;
  /** 캐시 동기화 유틸리티 */
  cacheSync: CacheSync;
  /** AbortController 참조 */
  abortControllerRef: MutableRefObject<AbortController | null>;
  /** 시스템 메시지 여부 (에러 롤백 시 사용) */
  isSystemMessage: boolean;
  /** 메시지 생성 함수 */
  createMessage: (sessionId: string, role: 'user' | 'assistant', content: string) => ChatMessage;
  /** 현재 메시지 목록 getter (onComplete에서 캐시 동기화용) */
  getMessages: () => ChatMessage[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 도구 상태 정리 스케줄러
 */
function createToolCleanupScheduler(dispatch: Dispatch<ChatAction>) {
  return (status: 'completed' | 'error', delayMs: number) => {
    setTimeout(() => {
      dispatch({ type: 'CLEANUP_TOOLS', status });
    }, delayMs);
  };
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * SSE 스트리밍 콜백 객체 생성
 *
 * @param ctx - 콜백 빌더 컨텍스트
 * @returns ChatStreamCallbacks 객체
 *
 * @example
 * ```ts
 * const callbacks = createChatCallbacks({
 *   sessionId,
 *   dispatch,
 *   cacheSync,
 *   abortControllerRef,
 *   isSystemMessage: isSystem,
 *   createMessage,
 *   getMessages: () => stateRef.current.messages,
 * });
 * abortControllerRef.current = aiChatApi.sendMessage(sessionId, message, callbacks);
 * ```
 */
export function createChatCallbacks(ctx: CallbackBuilderContext): ChatStreamCallbacks {
  const {
    sessionId,
    dispatch,
    cacheSync,
    abortControllerRef,
    isSystemMessage,
    createMessage,
    getMessages,
  } = ctx;

  const scheduleToolCleanup = createToolCleanupScheduler(dispatch);

  return {
    onMessage: (chunk) => {
      dispatch({ type: 'APPEND_STREAMING', chunk });
    },

    onToolStart: (event: ToolEvent) => {
      dispatch({ type: 'TOOL_START', event });
    },

    onToolDone: (event: ToolEvent) => {
      dispatch({ type: 'TOOL_DONE', event });
    },

    onInputRequest: (request: InputRequest) => {
      dispatch({ type: 'SET_PENDING_INPUT', input: request });
      cacheSync.syncPendingInput(request);
    },

    onRoutinePreview: (preview: RoutinePreviewData) => {
      dispatch({ type: 'SET_ROUTINE_PREVIEW', preview });
      cacheSync.syncRoutinePreview(preview);
    },

    onRoutineApplied: (event: RoutineAppliedEvent) => {
      dispatch({ type: 'SET_APPLIED_ROUTINE', event });
      cacheSync.syncRoutineApplied(event);
    },

    onRoutineProgress: (event: RoutineProgressEvent) => {
      dispatch({ type: 'SET_ROUTINE_PROGRESS', progress: event });
    },

    onMealPlanPreview: (preview: MealPlanPreviewData) => {
      dispatch({ type: 'SET_MEAL_PREVIEW', preview });
      cacheSync.syncMealPlanPreview(preview);
    },

    onMealPlanApplied: (event: MealPlanAppliedEvent) => {
      dispatch({ type: 'SET_APPLIED_MEAL', event });
      cacheSync.syncMealPlanApplied(event);
    },

    onMealPlanProgress: (event: MealPlanProgressEvent) => {
      dispatch({ type: 'SET_MEAL_PROGRESS', progress: event });
    },

    onProfileConfirmation: (request: ProfileConfirmationRequest) => {
      dispatch({ type: 'SET_PROFILE_CONFIRMATION', confirmation: request });
      cacheSync.syncProfileConfirmation(request);
    },

    onComplete: (fullMessage) => {
      // ⚠️ 중요: abortControllerRef를 먼저 null로 설정
      // invalidateQueries가 캐시 업데이트 → useEffect cleanup 트리거할 수 있음
      abortControllerRef.current = null;

      const newMessage = fullMessage.trim()
        ? createMessage(sessionId, 'assistant', fullMessage)
        : null;

      dispatch({ type: 'COMPLETE_SENDING', message: newMessage });

      // React Query active 캐시 동기화
      const updatedMessages = newMessage
        ? [...getMessages(), newMessage]
        : getMessages();
      cacheSync.syncMessages(updatedMessages);

      // 도구 상태 정리
      scheduleToolCleanup('completed', AI_CHAT_TIMING.TOOL_COMPLETED_DISPLAY_MS);
      scheduleToolCleanup('error', AI_CHAT_TIMING.TOOL_ERROR_DISPLAY_MS);

      // 캐시 갱신 (detail만 무효화)
      cacheSync.invalidateDetail(sessionId);
    },

    onError: (error) => {
      // AbortError는 정상적인 취소이므로 무시
      if (error.name === 'AbortError') {
        abortControllerRef.current = null;
        return;
      }

      dispatch({
        type: 'SET_ERROR',
        error: error.message || '메시지 전송에 실패했습니다.',
        rollbackLastMessage: !isSystemMessage,
      });

      abortControllerRef.current = null;
    },
  };
}
