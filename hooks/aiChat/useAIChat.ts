'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { aiChatApi, ChatStreamCallbacks, ToolEvent } from '@/lib/api/conversation';
import { queryKeys } from '@/lib/constants/queryKeys';
import { ChatMessage, AISessionCompat } from '@/lib/types/chat';
import type { AIToolName, AIToolStatus } from '@/lib/types/fitness';

/**
 * AI 채팅 상태 인터페이스
 */
interface ChatState {
  /** 로컬 메시지 목록 (캐시 무효화와 독립적) */
  localMessages: ChatMessage[];
  /** 스트리밍 중인 AI 응답 */
  streamingContent: string;
  /** 전송 중 여부 */
  isSending: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 현재 실행 중인 도구 상태 목록 */
  activeTools: AIToolStatus[];
}

/**
 * AI 채팅 훅 반환값 인터페이스
 */
export interface UseAIChatReturn {
  /** 메시지 목록 (세션에서 가져옴) */
  messages: ChatMessage[];
  /** 스트리밍 중인 AI 응답 */
  streamingContent: string;
  /** 스트리밍/전송 중 여부 */
  isStreaming: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 현재 실행 중인 도구 상태 목록 */
  activeTools: AIToolStatus[];
  /** 메시지 전송 */
  sendMessage: (message: string) => void;
  /** 스트리밍 취소 */
  cancelStream: () => void;
  /** 에러 초기화 */
  clearError: () => void;
}

/**
 * AI 채팅 훅 (새 스키마 버전)
 *
 * SSE 스트리밍을 사용한 AI 채팅 기능 제공
 * 로컬 상태로 메시지를 관리하여 캐시 무효화 문제 해결
 * conversations + chat_messages 테이블 사용
 *
 * @param session - AI 세션 (useActiveAISession에서 받은 세션 객체)
 *
 * @example
 * const { data: session } = useActiveAISession('workout');
 * const { messages, sendMessage, isStreaming, streamingContent } = useAIChat(session);
 */
export function useAIChat(session: AISessionCompat | null | undefined): UseAIChatReturn {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const [state, setState] = useState<ChatState>({
    localMessages: [],
    streamingContent: '',
    isSending: false,
    error: null,
    activeTools: [],
  });

  // 세션이 변경되면 메시지 동기화
  useEffect(() => {
    if (session?.id && session.id !== sessionIdRef.current) {
      sessionIdRef.current = session.id;
      setState((prev) => ({
        ...prev,
        localMessages: session.messages ?? [],
      }));
    }
  }, [session?.id, session?.messages]);

  const sessionId = session?.id;

  /**
   * 메시지 전송 및 스트리밍 처리
   */
  const sendMessage = useCallback(
    (message: string) => {
      if (!sessionId || state.isSending || !message.trim()) {
        return;
      }

      // 이전 스트림 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 낙관적 업데이트: 사용자 메시지 즉시 로컬 상태에 추가
      // 이전 도구 상태도 초기화 (새 대화 시작)
      const userMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        conversationId: sessionId,
        senderId: undefined,
        role: 'user',
        content: message,
        contentType: 'text',
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        localMessages: [...prev.localMessages, userMessage],
        streamingContent: '',
        isSending: true,
        error: null,
        activeTools: [], // 새 메시지 전송 시 이전 도구 상태 초기화
      }));

      const callbacks: ChatStreamCallbacks = {
        onMessage: (chunk) => {
          setState((prev) => ({
            ...prev,
            streamingContent: prev.streamingContent + chunk,
          }));
        },
        onToolStart: (event: ToolEvent) => {
          const toolStatus: AIToolStatus = {
            toolCallId: event.toolCallId,
            name: event.name as AIToolName,
            status: 'running',
          };
          setState((prev) => ({
            ...prev,
            activeTools: [...prev.activeTools, toolStatus],
          }));
        },
        onToolDone: (event: ToolEvent) => {
          setState((prev) => ({
            ...prev,
            activeTools: prev.activeTools.map((tool) =>
              tool.toolCallId === event.toolCallId
                ? {
                    ...tool,
                    status: event.success ? 'completed' : 'error',
                    error: event.error,
                  }
                : tool
            ),
          }));
        },
        onComplete: (fullMessage) => {
          // AI 응답 메시지를 로컬 상태에 추가
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            conversationId: sessionId,
            senderId: undefined,
            role: 'assistant',
            content: fullMessage,
            contentType: 'text',
            createdAt: new Date().toISOString(),
          };

          setState((prev) => ({
            ...prev,
            localMessages: [...prev.localMessages, assistantMessage],
            streamingContent: '',
            isSending: false,
            error: null,
            // activeTools는 유지 (완료 상태 표시)
          }));

          // 완료된 도구: 2초 후 제거
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              activeTools: prev.activeTools.filter((tool) => tool.status !== 'completed'),
            }));
          }, 2000);

          // 에러 도구: 5초 후 제거 (사용자가 확인할 시간 제공)
          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              activeTools: prev.activeTools.filter((tool) => tool.status !== 'error'),
            }));
          }, 5000);

          // 백그라운드에서 캐시 업데이트 (UI에 영향 없음)
          queryClient.invalidateQueries({
            queryKey: queryKeys.aiSession.active(session?.purpose ?? 'workout'),
          });

          abortControllerRef.current = null;
        },
        onError: (error) => {
          // 에러 시 마지막 사용자 메시지 롤백
          // activeTools는 유지 (에러 상태 표시용)
          setState((prev) => ({
            ...prev,
            localMessages: prev.localMessages.slice(0, -1),
            streamingContent: '',
            isSending: false,
            error: error.message || '메시지 전송에 실패했습니다.',
          }));

          abortControllerRef.current = null;
        },
      };

      abortControllerRef.current = aiChatApi.sendMessage(
        sessionId,
        message,
        callbacks
      );
    },
    [sessionId, session?.purpose, state.isSending, queryClient]
  );

  /**
   * 스트리밍 취소
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      streamingContent: '',
      isSending: false,
    }));
  }, []);

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    messages: state.localMessages,
    streamingContent: state.streamingContent,
    isStreaming: state.isSending,
    error: state.error,
    activeTools: state.activeTools,
    sendMessage,
    cancelStream,
    clearError,
  };
}
