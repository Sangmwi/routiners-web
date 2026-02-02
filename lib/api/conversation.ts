/**
 * Conversation API Layer (새 스키마용)
 *
 * conversations + chat_messages 테이블 기반 API
 * AI 채팅과 유저 간 채팅 모두 지원
 *
 * @throws {ApiError} 모든 API 에러는 ApiError로 통일
 */

import { ApiError, InputRequest, RoutinePreviewData } from '@/lib/types';
import { authFetch } from '@/lib/utils/authFetch';
import {
  Conversation,
  ConversationCreateData,
  ConversationUpdateData,
  ChatMessage,
  MessageCreateData,
  ProfileConfirmationRequest,
} from '@/lib/types/chat';
import { api } from './client';

// ============================================================================
// Query Parameters Types
// ============================================================================

/**
 * Phase 18: aiPurpose, aiStatus 필터 제거 (레거시)
 */
export interface ConversationListParams {
  type?: 'ai' | 'direct' | 'group';
  limit?: number;
  offset?: number;
}

export interface MessageListParams {
  limit?: number;
  cursor?: string; // 페이지네이션 커서 (created_at)
}

const BASE_URL = '/api/conversations';

// ============================================================================
// Conversation API
// ============================================================================

export const conversationApi = {
  /**
   * 대화방 목록 조회
   *
   * Phase 18: aiPurpose, aiStatus 필터 제거 (레거시)
   */
  async getConversations(params: ConversationListParams = {}): Promise<Conversation[]> {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.set('type', params.type);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    const url = `${BASE_URL}${query ? `?${query}` : ''}`;

    return api.getOrThrow<Conversation[]>(url);
  },

  /**
   * 특정 대화방 조회
   */
  async getConversation(id: string): Promise<Conversation | null> {
    return api.get<Conversation>(`${BASE_URL}/${id}`);
  },

  /**
   * 새 대화방 생성
   */
  async createConversation(data: ConversationCreateData): Promise<Conversation> {
    return api.post<Conversation>(BASE_URL, data);
  },

  /**
   * 대화방 업데이트
   */
  async updateConversation(id: string, data: ConversationUpdateData): Promise<Conversation> {
    return api.patch<Conversation>(`${BASE_URL}/${id}`, data);
  },

  /**
   * 대화방 삭제 (소프트 삭제)
   */
  async deleteConversation(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`${BASE_URL}/${id}`) as Promise<{ success: boolean }>;
  },

  /**
   * 프로필 확인 메타데이터 클리어
   * - 프로필 확인/수정 UI 응답 후 pending 상태 정리
   */
  async clearProfileConfirmation(id: string): Promise<void> {
    await api.patch(`${BASE_URL}/${id}/metadata`, { clearProfileConfirmation: true });
  },

  /**
   * 시스템 메시지 삽입 (대화 히스토리에만 기록, AI 응답 없음)
   * - 루틴 적용/프로필 확인 완료 시 요약 메시지용
   */
  async insertSystemMessage(
    conversationId: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const response = await authFetch(`/api/coach/conversations/${conversationId}/messages/system`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, metadata }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[insertSystemMessage] API Error:', {
        status: response.status,
        error: errorData,
        conversationId,
      });
      throw new Error(errorData.error || '시스템 메시지 추가 실패');
    }
  },
};

// ============================================================================
// Message API
// ============================================================================

export const messageApi = {
  /**
   * 메시지 목록 조회 (페이지네이션)
   */
  async getMessages(
    conversationId: string,
    params: MessageListParams = {}
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean; nextCursor?: string }> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.cursor) searchParams.set('cursor', params.cursor);

    const query = searchParams.toString();
    const url = `${BASE_URL}/${conversationId}/messages${query ? `?${query}` : ''}`;

    return api.getOrThrow<{ messages: ChatMessage[]; hasMore: boolean; nextCursor?: string }>(url);
  },

  /**
   * 메시지 전송 (일반)
   */
  async sendMessage(conversationId: string, data: MessageCreateData): Promise<ChatMessage> {
    return api.post<ChatMessage>(`${BASE_URL}/${conversationId}/messages`, data);
  },

  /**
   * 메시지 수정
   */
  async updateMessage(messageId: string, content: string): Promise<ChatMessage> {
    return api.patch<ChatMessage>(`/api/messages/${messageId}`, { content });
  },

  /**
   * 메시지 삭제 (소프트 삭제)
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/api/messages/${messageId}`) as Promise<{ success: boolean }>;
  },
};

// ============================================================================
// AI Chat API (SSE Streaming) - 새 스키마용
// ============================================================================

export interface ToolEvent {
  toolCallId: string;
  name: string;
  success?: boolean;
  data?: unknown;
  error?: string;
}

export interface RoutineAppliedEvent {
  previewId: string;
  eventsCreated: number;
  startDate: string;
}

export interface RoutineProgressEvent {
  progress: number;
  stage: string;
}

/** Phase 16: SSE complete 이벤트 메시지 형식 */
export interface CompleteEventMessage {
  id: string;
  content: string;
  contentType: string;
  createdAt: string;
}

/** Phase 16: SSE complete 이벤트 데이터 (ISP: 옵셔널 파라미터) */
export interface CompleteEventData {
  userMessage?: CompleteEventMessage;
  aiMessages?: CompleteEventMessage[];
}

export interface ChatStreamCallbacks {
  onMessage: (chunk: string) => void;
  /** Phase 16: data 파라미터 추가 (LSP: 기존 호출도 정상 동작) */
  onComplete: (fullMessage: string, data?: CompleteEventData) => void;
  onError: (error: Error) => void;
  onToolStart?: (event: ToolEvent) => void;
  onToolDone?: (event: ToolEvent) => void;
  /** 객관식 입력 UI 요청 */
  onInputRequest?: (request: InputRequest) => void;
  /** 루틴 미리보기 표시 */
  onRoutinePreview?: (preview: RoutinePreviewData) => void;
  /** 루틴 적용 완료 */
  onRoutineApplied?: (event: RoutineAppliedEvent) => void;
  /** 루틴 생성 진행률 */
  onRoutineProgress?: (event: RoutineProgressEvent) => void;
  /** 프로필 데이터 확인 요청 */
  onProfileConfirmation?: (request: ProfileConfirmationRequest) => void;
}

export const aiChatApi = {
  /**
   * AI 채팅 메시지 전송 (SSE 스트리밍)
   */
  sendMessage(
    conversationId: string,
    message: string,
    callbacks: ChatStreamCallbacks
  ): AbortController {
    const controller = new AbortController();

    // SSE 스트리밍은 특수 처리 필요 - authFetch 직접 사용
    (async () => {
      try {
        const response = await authFetch(`${BASE_URL}/${conversationId}/messages/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw await ApiError.fromResponse(response);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('스트리밍을 지원하지 않는 환경입니다.');
        }

        const decoder = new TextDecoder();
        let fullMessage = '';
        let currentEventType = '';
        let dataBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            // SSE event type
            if (line.startsWith('event: ')) {
              currentEventType = line.slice(7).trim();
              continue;
            }

            // SSE data
            if (line.startsWith('data: ')) {
              dataBuffer = line.slice(6);

              // 기존 포맷 호환 (event 없이 data만 오는 경우)
              if (!currentEventType) {
                if (dataBuffer === '[DONE]') {
                  callbacks.onComplete(fullMessage);
                  return;
                }

                try {
                  const parsed = JSON.parse(dataBuffer);
                  if (parsed.content) {
                    fullMessage += parsed.content;
                    callbacks.onMessage(parsed.content);
                  }
                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                } catch (e) {
                  if (e instanceof SyntaxError) continue;
                  throw e;
                }
                continue;
              }

              // 새로운 이벤트 포맷 처리
              try {
                const parsed = JSON.parse(dataBuffer);

                switch (currentEventType) {
                  case 'content':
                    if (parsed.content) {
                      fullMessage += parsed.content;
                      callbacks.onMessage(parsed.content);
                    }
                    break;
                  case 'tool_start':
                    callbacks.onToolStart?.(parsed);
                    break;
                  case 'tool_done':
                    callbacks.onToolDone?.(parsed);
                    break;
                  case 'input_request':
                    callbacks.onInputRequest?.(parsed as InputRequest);
                    break;
                  case 'routine_preview':
                    callbacks.onRoutinePreview?.(parsed as RoutinePreviewData);
                    break;
                  case 'routine_applied':
                    callbacks.onRoutineApplied?.(parsed as RoutineAppliedEvent);
                    break;
                  case 'routine_progress':
                    callbacks.onRoutineProgress?.(parsed as RoutineProgressEvent);
                    break;
                  case 'profile_confirmation':
                    callbacks.onProfileConfirmation?.(parsed as ProfileConfirmationRequest);
                    break;
                  // Phase 16: 'complete' + data 전달 (7.5KB refetch → 0KB 부분 업데이트)
                  case 'complete':
                    callbacks.onComplete(fullMessage, parsed as CompleteEventData);
                    return;
                  case 'error':
                    throw new Error(parsed.error || 'Unknown error');
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }

              // 이벤트 처리 후 초기화
              currentEventType = '';
              dataBuffer = '';
            }

            // 빈 줄은 이벤트 끝을 의미
            if (line === '') {
              currentEventType = '';
              dataBuffer = '';
            }
          }
        }

        callbacks.onComplete(fullMessage);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        callbacks.onError(error instanceof Error ? error : new Error('알 수 없는 오류'));
      }
    })();

    return controller;
  },

  /**
   * AI 채팅 메시지 전송 (Non-streaming)
   */
  async sendMessageSync(conversationId: string, message: string): Promise<string> {
    const data = await api.post<{ content: string }>(`${BASE_URL}/${conversationId}/messages/ai`, {
      message,
    }, {
      headers: { 'X-No-Stream': 'true' },
    });
    return data.content;
  },
};

// ============================================================================
// Read Status API
// ============================================================================

export const readStatusApi = {
  /**
   * 읽음 표시 업데이트
   */
  async markAsRead(conversationId: string): Promise<void> {
    await api.post(`${BASE_URL}/${conversationId}/read`);
  },
};
