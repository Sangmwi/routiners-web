/**
 * Chat Callbacks Builder
 *
 * sendMessageCore에서 사용하는 SSE 콜백 객체를 생성
 * Phase L: 170줄 콜백 블록을 별도 모듈로 분리하여 테스트 가능성 향상
 */

import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type {
  ChatStreamCallbacks,
  ToolEvent,
  RoutineAppliedEvent,
  RoutineProgressEvent,
  MealPlanAppliedEvent,
  MealPlanProgressEvent,
} from '@/lib/api/conversation';
import type { ChatMessage, ProfileConfirmationRequest } from '@/lib/types/chat';
import type { AIToolName, AIToolStatus, InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
import type { MealPlanPreviewData } from '@/lib/types/meal';
import { AI_CHAT_TIMING } from '@/lib/constants/aiChat';
import type { useChatCacheSync } from '../useChatCacheSync';

// =============================================================================
// Types
// =============================================================================

/**
 * 콜백 빌더의 ChatState (useAIChat의 ChatState와 동일)
 */
interface ChatState {
  messages: ChatMessage[];
  streamingContent: string;
  isSending: boolean;
  error: string | null;
  activeTools: AIToolStatus[];
  pendingInput: InputRequest | null;
  pendingRoutinePreview: RoutinePreviewData | null;
  appliedRoutine: RoutineAppliedEvent | null;
  routineProgress: RoutineProgressEvent | null;
  pendingMealPreview: MealPlanPreviewData | null;
  appliedMealPlan: MealPlanAppliedEvent | null;
  mealProgress: MealPlanProgressEvent | null;
  pendingProfileConfirmation: ProfileConfirmationRequest | null;
  pendingStart: boolean;
}

type SetState = Dispatch<SetStateAction<ChatState>>;
type CacheSync = ReturnType<typeof useChatCacheSync>;

/**
 * 콜백 빌더에 필요한 컨텍스트
 */
export interface CallbackBuilderContext {
  /** 세션 ID */
  sessionId: string;
  /** 상태 업데이터 */
  setState: SetState;
  /** 캐시 동기화 유틸리티 */
  cacheSync: CacheSync;
  /** AbortController 참조 */
  abortControllerRef: MutableRefObject<AbortController | null>;
  /** 시스템 메시지 여부 (에러 롤백 시 사용) */
  isSystemMessage: boolean;
  /** 메시지 생성 함수 */
  createMessage: (sessionId: string, role: 'user' | 'assistant', content: string) => ChatMessage;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 도구 상태 정리 스케줄러
 */
function createToolCleanupScheduler(setState: SetState) {
  return (status: AIToolStatus['status'], delayMs: number) => {
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        activeTools: prev.activeTools.filter((t) => t.status !== status),
      }));
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
 *   setState,
 *   cacheSync,
 *   abortControllerRef,
 *   isSystemMessage: isSystem,
 *   createMessage,
 * });
 * abortControllerRef.current = aiChatApi.sendMessage(sessionId, message, callbacks);
 * ```
 */
export function createChatCallbacks(ctx: CallbackBuilderContext): ChatStreamCallbacks {
  const {
    sessionId,
    setState,
    cacheSync,
    abortControllerRef,
    isSystemMessage,
    createMessage,
  } = ctx;

  const scheduleToolCleanup = createToolCleanupScheduler(setState);

  return {
    onMessage: (chunk) => {
      setState((prev) => ({
        ...prev,
        streamingContent: prev.streamingContent + chunk,
      }));
    },

    onToolStart: (event: ToolEvent) => {
      setState((prev) => ({
        ...prev,
        activeTools: [
          ...prev.activeTools,
          {
            toolCallId: event.toolCallId,
            name: event.name as AIToolName,
            status: 'running',
          },
        ],
      }));
    },

    onToolDone: (event: ToolEvent) => {
      setState((prev) => ({
        ...prev,
        activeTools: prev.activeTools.map((tool) =>
          tool.toolCallId === event.toolCallId
            ? { ...tool, status: event.success ? 'completed' : 'error', error: event.error }
            : tool
        ),
      }));
    },

    onInputRequest: (request: InputRequest) => {
      setState((prev) => ({
        ...prev,
        pendingInput: request,
        isSending: false,
      }));
      cacheSync.syncPendingInput(request);
    },

    onRoutinePreview: (preview: RoutinePreviewData) => {
      setState((prev) => ({
        ...prev,
        pendingRoutinePreview: preview,
        pendingInput: null,
        routineProgress: null,
        isSending: false,
      }));
      cacheSync.syncRoutinePreview(preview);
    },

    onRoutineApplied: (event: RoutineAppliedEvent) => {
      setState((prev) => ({
        ...prev,
        appliedRoutine: event,
        pendingRoutinePreview: null,
      }));
      cacheSync.syncRoutineApplied(event);
    },

    onRoutineProgress: (event: RoutineProgressEvent) => {
      setState((prev) => ({
        ...prev,
        routineProgress: event,
      }));
    },

    onMealPlanPreview: (preview: MealPlanPreviewData) => {
      setState((prev) => ({
        ...prev,
        pendingMealPreview: preview,
        pendingInput: null,
        mealProgress: null,
        isSending: false,
      }));
      cacheSync.syncMealPlanPreview(preview);
    },

    onMealPlanApplied: (event: MealPlanAppliedEvent) => {
      setState((prev) => ({
        ...prev,
        appliedMealPlan: event,
        pendingMealPreview: null,
      }));
      cacheSync.syncMealPlanApplied(event);
    },

    onMealPlanProgress: (event: MealPlanProgressEvent) => {
      setState((prev) => ({
        ...prev,
        mealProgress: event,
      }));
    },

    onProfileConfirmation: (request: ProfileConfirmationRequest) => {
      setState((prev) => ({
        ...prev,
        pendingProfileConfirmation: request,
        isSending: false,
      }));
      cacheSync.syncProfileConfirmation(request);
    },

    onComplete: (fullMessage) => {
      // ⚠️ 중요: abortControllerRef를 먼저 null로 설정
      // invalidateQueries가 캐시 업데이트 → useEffect cleanup 트리거할 수 있음
      abortControllerRef.current = null;

      const newMessage = fullMessage.trim()
        ? createMessage(sessionId, 'assistant', fullMessage)
        : null;

      setState((prev) => {
        const updatedMessages = newMessage
          ? [...prev.messages, newMessage]
          : prev.messages;

        // React Query active 캐시 동기화
        cacheSync.syncMessages(updatedMessages);

        return {
          ...prev,
          messages: updatedMessages,
          streamingContent: '',
          isSending: false,
          error: null,
          routineProgress: null,
          mealProgress: null,
        };
      });

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

      setState((prev) => ({
        ...prev,
        // 에러 시 마지막 사용자 메시지 롤백 (시스템 메시지 제외)
        messages: isSystemMessage ? prev.messages : prev.messages.slice(0, -1),
        streamingContent: '',
        isSending: false,
        error: error.message || '메시지 전송에 실패했습니다.',
      }));

      abortControllerRef.current = null;
    },
  };
}
