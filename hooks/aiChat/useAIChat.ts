'use client';

import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { aiChatApi, ChatStreamCallbacks, ToolEvent, RoutineAppliedEvent, RoutineProgressEvent } from '@/lib/api/conversation';
import { queryKeys } from '@/lib/constants/queryKeys';
import {
  AI_CHAT_TIMING,
  AI_SYSTEM_MESSAGE,
  isSystemMessage,
  createInitialGreetingMessage,
} from '@/lib/constants/aiChat';
import { ChatMessage, AISessionCompat } from '@/lib/types/chat';
import type { AIToolName, AIToolStatus, InputRequest, RoutinePreviewData } from '@/lib/types/fitness';

// =============================================================================
// Types
// =============================================================================

interface ChatState {
  messages: ChatMessage[];
  streamingContent: string;
  isSending: boolean;
  error: string | null;
  activeTools: AIToolStatus[];
  pendingInput: InputRequest | null;
  /** 대기 중인 루틴 미리보기 (사용자 확인 대기) */
  pendingRoutinePreview: RoutinePreviewData | null;
  /** 루틴 적용 완료 정보 */
  appliedRoutine: RoutineAppliedEvent | null;
  /** 루틴 생성 진행률 */
  routineProgress: RoutineProgressEvent | null;
}

export interface UseAIChatReturn {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  error: string | null;
  activeTools: AIToolStatus[];
  pendingInput: InputRequest | null;
  /** 대기 중인 루틴 미리보기 */
  pendingRoutinePreview: RoutinePreviewData | null;
  /** 루틴 적용 완료 정보 */
  appliedRoutine: RoutineAppliedEvent | null;
  /** 루틴 생성 진행률 */
  routineProgress: RoutineProgressEvent | null;
  sendMessage: (message: string) => void;
  submitInput: (value: string | string[]) => void;
  /** 루틴 미리보기 적용 (forceOverwrite: 충돌 시 덮어쓰기) */
  applyRoutine: (forceOverwrite?: boolean) => void;
  /** 루틴 수정 요청 */
  requestRevision: (feedback: string) => void;
  cancelStream: () => void;
  clearError: () => void;
}

// =============================================================================
// Constants & Helpers
// =============================================================================

const INITIAL_STATE: ChatState = {
  messages: [],
  streamingContent: '',
  isSending: false,
  error: null,
  activeTools: [],
  pendingInput: null,
  pendingRoutinePreview: null,
  appliedRoutine: null,
  routineProgress: null,
};

/** 메시지 생성 헬퍼 */
function createMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): ChatMessage {
  return {
    id: `${role}-${Date.now()}`,
    conversationId: sessionId,
    senderId: undefined,
    role,
    content,
    contentType: 'text',
    createdAt: new Date().toISOString(),
  };
}

/** UI에 표시할 메시지만 필터링 (tool_call, tool_result 제외) */
function filterDisplayableMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((m) => m.contentType === 'text' || !m.contentType);
}

// =============================================================================
// Hook
// =============================================================================

/**
 * AI 채팅 훅
 *
 * SSE 스트리밍 기반 AI 채팅 기능 제공
 * - 메시지는 DB에 저장되고 세션에서 동기화
 * - tool_call/tool_result는 UI에 표시하지 않음
 */
export function useAIChat(
  session: AISessionCompat | null | undefined
): UseAIChatReturn {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const pendingUserMessageRef = useRef<string | null>(null); // isSending 중 대기 메시지
  const isSendingRef = useRef(false); // 최신 isSending 값 추적 (closure 문제 해결)

  const [state, setState] = useState<ChatState>(INITIAL_STATE);

  // isSendingRef를 항상 최신 상태로 유지
  isSendingRef.current = state.isSending;

  const sessionId = session?.id;
  const purpose = session?.purpose ?? 'workout';

  // ---------------------------------------------------------------------------
  // 도구 상태 정리 스케줄러
  // ---------------------------------------------------------------------------

  const scheduleToolCleanup = (status: AIToolStatus['status'], delayMs: number) => {
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        activeTools: prev.activeTools.filter((t) => t.status !== status),
      }));
    }, delayMs);
  };

  // ---------------------------------------------------------------------------
  // 메시지 전송 (내부 + 외부 공용)
  // ---------------------------------------------------------------------------

  const sendMessageCore = (message: string, options: { skipGuards?: boolean; skipMessageAdd?: boolean } = {}) => {
    const { skipGuards = false, skipMessageAdd = false } = options;

    if (!sessionId) return;
    if (!skipGuards && (state.isSending || !message.trim())) return;

    // 이전 스트림 취소
    abortControllerRef.current?.abort();

    const isSystem = isSystemMessage(message);

    // 낙관적 업데이트 (시스템 메시지 제외, skipMessageAdd면 메시지 추가 생략)
    setState((prev) => ({
      ...prev,
      messages: isSystem || skipMessageAdd
        ? prev.messages
        : [...prev.messages, createMessage(sessionId, 'user', message)],
      streamingContent: '',
      isSending: true,
      error: null,
      activeTools: [],
      pendingInput: skipGuards ? prev.pendingInput : null, // 자동 시작 시 pendingInput 유지
    }));

    const callbacks: ChatStreamCallbacks = {
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
      },

      onRoutinePreview: (preview: RoutinePreviewData) => {
        setState((prev) => ({
          ...prev,
          pendingRoutinePreview: preview,
          routineProgress: null, // 진행률 초기화
          isSending: false,
        }));
      },

      onRoutineApplied: (event: RoutineAppliedEvent) => {
        setState((prev) => ({
          ...prev,
          appliedRoutine: event,
          pendingRoutinePreview: null, // 미리보기 상태 해제
        }));
      },

      onRoutineProgress: (event: RoutineProgressEvent) => {
        setState((prev) => ({
          ...prev,
          routineProgress: event,
        }));
      },

      onComplete: (fullMessage) => {
        setState((prev) => ({
          ...prev,
          messages: fullMessage.trim()
            ? [...prev.messages, createMessage(sessionId, 'assistant', fullMessage)]
            : prev.messages,
          streamingContent: '',
          isSending: false,
          error: null,
          routineProgress: null, // 진행률 초기화
        }));

        // 도구 상태 정리
        scheduleToolCleanup('completed', AI_CHAT_TIMING.TOOL_COMPLETED_DISPLAY_MS);
        scheduleToolCleanup('error', AI_CHAT_TIMING.TOOL_ERROR_DISPLAY_MS);

        // 캐시 갱신
        queryClient.invalidateQueries({
          queryKey: queryKeys.aiSession.active(purpose),
        });

        abortControllerRef.current = null;
      },

      onError: (error) => {
        setState((prev) => ({
          ...prev,
          // 에러 시 마지막 사용자 메시지 롤백 (시스템 메시지 제외)
          messages: isSystem ? prev.messages : prev.messages.slice(0, -1),
          streamingContent: '',
          isSending: false,
          error: error.message || '메시지 전송에 실패했습니다.',
        }));

        abortControllerRef.current = null;
      },
    };

    abortControllerRef.current = aiChatApi.sendMessage(sessionId, message, callbacks);
  };

  // 외부 API: 가드 체크 적용
  const sendMessage = (message: string) => sendMessageCore(message, {});

  // ---------------------------------------------------------------------------
  // 세션 변경 시 메시지 동기화 + 새 세션 자동 시작
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!session?.id) return;

    const isNewSession = session.id !== sessionIdRef.current;
    if (!isNewSession) return;

    sessionIdRef.current = session.id;

    // DB 메시지 동기화 (tool_call, tool_result 제외)
    const displayMessages = filterDisplayableMessages(session.messages ?? []);
    const hasMessages = displayMessages.length > 0;

    if (hasMessages) {
      // 기존 세션 복귀: DB 메시지 + 미리보기 상태 복구
      const pendingPreview = session.metadata?.pending_preview ?? null;
      setState({
        ...INITIAL_STATE,
        messages: displayMessages,
        pendingRoutinePreview: pendingPreview,
      });
    } else {
      // 새 세션: 초기 인사말만 표시 + __START__ 전송
      // pendingInput은 AI가 request_user_input으로 직접 설정 (이미 데이터가 있으면 스킵)
      const greetingMessage = createInitialGreetingMessage(session.id, purpose);

      setState({
        ...INITIAL_STATE,
        messages: [greetingMessage],
        // pendingInput은 AI 응답에서 설정됨 (하드코딩 제거)
      });

      // __START__ 메시지 전송 (AI 대화 시작 트리거)
      const timer = setTimeout(() => {
        sendMessageCore(AI_SYSTEM_MESSAGE.START, { skipGuards: true });
      }, AI_CHAT_TIMING.AUTO_START_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, [session?.id, session?.messages, session?.metadata?.pending_preview, purpose]);

  // ---------------------------------------------------------------------------
  // 대기 중인 사용자 메시지 전송 (isSending이 false가 되면)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // isSending이 false이고 대기 중인 메시지가 있으면 전송
    if (!state.isSending && pendingUserMessageRef.current && sessionId) {
      const message = pendingUserMessageRef.current;
      // 먼저 ref를 null로 설정하여 중복 실행 방지
      pendingUserMessageRef.current = null;
      // 이미 submitInput에서 메시지가 추가되었으므로 skipMessageAdd
      sendMessageCore(message, { skipMessageAdd: true });
    }
  }, [state.isSending, sessionId]);

  // ---------------------------------------------------------------------------
  // 선택형 입력 제출
  // ---------------------------------------------------------------------------

  const submitInput = (value: string | string[]) => {
    if (!sessionId) return;

    const messageText = Array.isArray(value) ? value.join(', ') : value;

    // 사용자 메시지를 즉시 UI에 추가 (낙관적 업데이트)
    setState((prev) => {
      // pendingInput.message가 있으면 AI 메시지로 저장 (대화 흐름 유지)
      const messagesWithAI = prev.pendingInput?.message
        ? [...prev.messages, createMessage(sessionId, 'assistant', prev.pendingInput.message)]
        : prev.messages;

      // 사용자 메시지 추가
      const messagesWithUser = [...messagesWithAI, createMessage(sessionId, 'user', messageText)];

      return { ...prev, messages: messagesWithUser, pendingInput: null };
    });

    // isSendingRef를 사용하여 최신 값 확인 (closure 문제 방지)
    if (isSendingRef.current) {
      pendingUserMessageRef.current = messageText;
    } else {
      // 이미 위에서 메시지를 추가했으므로 skipMessageAdd
      sendMessageCore(messageText, { skipMessageAdd: true });
    }
  };

  // ---------------------------------------------------------------------------
  // 루틴 미리보기 적용 / 수정 요청
  // ---------------------------------------------------------------------------

  const applyRoutine = async (forceOverwrite?: boolean) => {
    if (!sessionId || !state.pendingRoutinePreview) return;

    const previewId = state.pendingRoutinePreview.id;

    // 로딩 상태로 전환
    setState((prev) => ({
      ...prev,
      isSending: true,
      error: null,
    }));

    try {
      // 직접 API 호출 (AI 의존성 제거)
      const response = await fetch('/api/routine/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: sessionId,
          previewId,
          forceOverwrite: forceOverwrite || false,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setState((prev) => ({
          ...prev,
          isSending: false,
          error: result.error || '루틴 적용에 실패했습니다.',
        }));
        return;
      }

      // 성공: appliedRoutine 상태 업데이트, pendingRoutinePreview 제거
      setState((prev) => ({
        ...prev,
        isSending: false,
        appliedRoutine: {
          previewId: result.data.previewId,
          eventsCreated: result.data.eventsCreated,
          startDate: result.data.startDate,
        },
        pendingRoutinePreview: null,
      }));

      // 캐시 갱신
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiSession.active(purpose),
      });
    } catch (error) {
      console.error('[applyRoutine] Error:', error);
      setState((prev) => ({
        ...prev,
        isSending: false,
        error: '루틴 적용 중 오류가 발생했습니다.',
      }));
    }
  };

  const requestRevision = (feedback: string) => {
    if (!sessionId || !state.pendingRoutinePreview) return;

    // 미리보기 상태 해제 후 피드백 메시지 전송
    setState((prev) => ({
      ...prev,
      pendingRoutinePreview: null,
    }));

    // 수정 요청 메시지 전송 (AI가 피드백 반영 후 다시 generate_routine_preview 호출)
    sendMessageCore(feedback, {});
  };

  // ---------------------------------------------------------------------------
  // 스트리밍 취소 & 에러 초기화
  // ---------------------------------------------------------------------------

  const cancelStream = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState((prev) => ({
      ...prev,
      streamingContent: '',
      isSending: false,
      pendingInput: null,
    }));
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    messages: state.messages,
    streamingContent: state.streamingContent,
    isStreaming: state.isSending,
    error: state.error,
    activeTools: state.activeTools,
    pendingInput: state.pendingInput,
    pendingRoutinePreview: state.pendingRoutinePreview,
    appliedRoutine: state.appliedRoutine,
    routineProgress: state.routineProgress,
    sendMessage,
    submitInput,
    applyRoutine,
    requestRevision,
    cancelStream,
    clearError,
  };
}
