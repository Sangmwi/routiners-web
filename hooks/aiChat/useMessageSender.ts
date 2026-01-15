'use client';

import { useRef, useEffect } from 'react';
import { aiChatApi } from '@/lib/api/conversation';
import { isSystemMessage } from '@/lib/constants/aiChat';
import type { ChatMessage } from '@/lib/types/chat';
import type { ChatAction, ChatState } from './helpers/chatReducer';
import type { UseChatCacheSync } from './useChatCacheSync';
import { createChatCallbacks } from './helpers/createChatCallbacks';

// =============================================================================
// Types
// =============================================================================

export interface SendMessageOptions {
  /** 전송 중/빈 메시지 가드 건너뛰기 */
  skipGuards?: boolean;
  /** 메시지 추가 건너뛰기 (이미 추가된 경우) */
  skipMessageAdd?: boolean;
  /** 명시적 메시지 배열 (비동기 상태 업데이트 문제 해결용) */
  messages?: ChatMessage[];
}

interface UseMessageSenderParams {
  sessionId: string | undefined;
  state: ChatState;
  stateRef: React.MutableRefObject<ChatState>;
  dispatch: React.Dispatch<ChatAction>;
  cacheSync: UseChatCacheSync;
  createMessage: (sessionId: string, role: 'user' | 'assistant', content: string) => ChatMessage;
}

export interface UseMessageSenderReturn {
  sendMessage: (message: string) => void;
  sendMessageWithOptions: (message: string, options?: SendMessageOptions) => void;
  submitInput: (value: string | string[]) => void;
  cancelStream: () => void;
  clearError: () => void;
  retryLastMessage: () => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * 메시지 전송 훅
 *
 * SSE 스트리밍 기반 메시지 전송 기능
 * - AbortController 관리
 * - 낙관적 업데이트
 * - 대기 메시지 큐
 * - 에러 시 재시도
 */
export function useMessageSender({
  sessionId,
  state,
  stateRef,
  dispatch,
  cacheSync,
  createMessage,
}: UseMessageSenderParams): UseMessageSenderReturn {
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingUserMessageRef = useRef<string | null>(null);
  const isSendingRef = useRef(false);
  const lastMessageRef = useRef<string | null>(null);

  // isSendingRef를 항상 최신 상태로 유지
  isSendingRef.current = state.isSending;

  // ---------------------------------------------------------------------------
  // 메시지 전송 (내부 + 외부 공용)
  // ---------------------------------------------------------------------------

  const sendMessageWithOptions = (message: string, options: SendMessageOptions = {}) => {
    const { skipGuards = false, skipMessageAdd = false, messages: providedMessages } = options;

    if (!sessionId) return;
    if (!skipGuards && (state.isSending || !message.trim())) return;

    // 마지막 메시지 저장 (재시도용)
    lastMessageRef.current = message;

    // 이전 스트림 취소
    abortControllerRef.current?.abort();

    const isSystem = isSystemMessage(message);

    // 낙관적 업데이트 (시스템 메시지 제외, skipMessageAdd면 메시지 추가 생략)
    const userMessage = !isSystem && !skipMessageAdd
      ? createMessage(sessionId, 'user', message)
      : null;

    // providedMessages가 있으면 사용 (submitInput에서 이미 메시지 추가됨)
    const baseMessages = providedMessages ?? state.messages;
    const updatedMessages = userMessage
      ? [...baseMessages, userMessage]
      : baseMessages;

    // 캐시 동기화 (사용자 메시지 추가 시)
    if (userMessage) {
      cacheSync.syncMessagesAndMetadata(updatedMessages, {
        pending_input: undefined,
        pending_profile_confirmation: undefined,
      });
    }

    dispatch({
      type: 'START_SENDING',
      messages: updatedMessages,
      keepPendingInput: skipGuards,
    });

    const callbacks = createChatCallbacks({
      sessionId,
      dispatch,
      cacheSync,
      abortControllerRef,
      isSystemMessage: isSystem,
      createMessage,
      getMessages: () => stateRef.current.messages,
    });

    abortControllerRef.current = aiChatApi.sendMessage(sessionId, message, callbacks);
  };

  // 외부 API: 가드 체크 적용
  const sendMessage = (message: string) => sendMessageWithOptions(message, {});

  // ---------------------------------------------------------------------------
  // 대기 중인 사용자 메시지 전송 (isSending이 false가 되면)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!state.isSending && pendingUserMessageRef.current && sessionId) {
      const message = pendingUserMessageRef.current;
      pendingUserMessageRef.current = null;
      sendMessageWithOptions(message, { skipMessageAdd: true });
    }
  }, [state.isSending, sessionId]);

  // ---------------------------------------------------------------------------
  // 선택형 입력 제출
  // ---------------------------------------------------------------------------

  const submitInput = (value: string | string[]) => {
    if (!sessionId) return;

    const messageText = Array.isArray(value) ? value.join(', ') : value;

    // 사용자 메시지를 즉시 UI에 추가 (낙관적 업데이트)
    const messagesWithAI = state.pendingInput?.message
      ? [...state.messages, createMessage(sessionId, 'assistant', state.pendingInput.message)]
      : state.messages;

    const messagesWithUser = [...messagesWithAI, createMessage(sessionId, 'user', messageText)];

    dispatch({ type: 'SUBMIT_INPUT', messages: messagesWithUser });

    // React Query 캐시 즉시 동기화 (race condition 방지)
    cacheSync.syncPendingInput(null);

    // isSendingRef를 사용하여 최신 값 확인 (closure 문제 방지)
    if (isSendingRef.current) {
      pendingUserMessageRef.current = messageText;
    } else {
      // messages 전달: React 비동기 상태 업데이트로 인해 state.messages가 아직 이전 값일 수 있음
      sendMessageWithOptions(messageText, { skipMessageAdd: true, messages: messagesWithUser });
    }
  };

  // ---------------------------------------------------------------------------
  // 스트리밍 취소 & 에러 초기화
  // ---------------------------------------------------------------------------

  const cancelStream = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    dispatch({ type: 'CANCEL_STREAM' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // ---------------------------------------------------------------------------
  // 마지막 메시지 재시도
  // ---------------------------------------------------------------------------

  const retryLastMessage = () => {
    if (lastMessageRef.current) {
      dispatch({ type: 'CLEAR_ERROR' });
      sendMessageWithOptions(lastMessageRef.current, {});
    }
  };

  // ---------------------------------------------------------------------------
  // Cleanup: 세션 변경 시 스트림 취소
  // ---------------------------------------------------------------------------

  const sessionIdRef = useRef<string | undefined>(sessionId);

  useEffect(() => {
    if (sessionId !== sessionIdRef.current && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  return {
    sendMessage,
    sendMessageWithOptions,
    submitInput,
    cancelStream,
    clearError,
    retryLastMessage,
  };
}
