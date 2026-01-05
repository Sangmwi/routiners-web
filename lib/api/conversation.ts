/**
 * Conversation API Layer (새 스키마용)
 *
 * conversations + chat_messages 테이블 기반 API
 * AI 채팅과 유저 간 채팅 모두 지원
 *
 * @throws {ApiError} 모든 API 에러는 ApiError로 통일
 */

import { ApiError } from '@/lib/types';
import { authFetch } from '@/lib/utils/authFetch';
import {
  Conversation,
  ConversationCreateData,
  ConversationUpdateData,
  ChatMessage,
  MessageCreateData,
  AISessionCompat,
  ConversationStatus,
} from '@/lib/types/chat';
import { SessionPurpose } from '@/lib/types/routine';

// ============================================================================
// Query Parameters Types
// ============================================================================

export interface ConversationListParams {
  type?: 'ai' | 'direct' | 'group';
  aiPurpose?: SessionPurpose;
  aiStatus?: ConversationStatus;
  limit?: number;
  offset?: number;
}

export interface MessageListParams {
  limit?: number;
  cursor?: string; // 페이지네이션 커서 (created_at)
}

// ============================================================================
// Conversation API
// ============================================================================

export const conversationApi = {
  /**
   * 대화방 목록 조회
   */
  async getConversations(params: ConversationListParams = {}): Promise<Conversation[]> {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.set('type', params.type);
    if (params.aiPurpose) searchParams.set('aiPurpose', params.aiPurpose);
    if (params.aiStatus) searchParams.set('aiStatus', params.aiStatus);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    const url = `/api/conversations${query ? `?${query}` : ''}`;

    const response = await authFetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },

  /**
   * 활성 AI 대화 조회 (purpose별 1개)
   */
  async getActiveAIConversation(purpose: SessionPurpose): Promise<AISessionCompat | null> {
    const response = await authFetch(`/api/conversations/ai/active?purpose=${purpose}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },

  /**
   * 특정 대화방 조회
   */
  async getConversation(id: string): Promise<Conversation | null> {
    const response = await authFetch(`/api/conversations/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },

  /**
   * 새 대화방 생성
   */
  async createConversation(data: ConversationCreateData): Promise<AISessionCompat> {
    const response = await authFetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },

  /**
   * 대화방 업데이트
   */
  async updateConversation(id: string, data: ConversationUpdateData): Promise<Conversation> {
    const response = await authFetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },

  /**
   * AI 대화 완료 처리
   */
  async completeAIConversation(id: string): Promise<Conversation> {
    const response = await authFetch(`/api/conversations/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },

  /**
   * AI 대화 포기 처리
   */
  async abandonAIConversation(id: string): Promise<Conversation> {
    const response = await authFetch(`/api/conversations/${id}/abandon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },

  /**
   * 대화방 삭제 (소프트 삭제)
   */
  async deleteConversation(id: string): Promise<{ success: boolean }> {
    const response = await authFetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
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
    const url = `/api/conversations/${conversationId}/messages${query ? `?${query}` : ''}`;

    const response = await authFetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },

  /**
   * 메시지 전송 (일반)
   */
  async sendMessage(conversationId: string, data: MessageCreateData): Promise<ChatMessage> {
    const response = await authFetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },

  /**
   * 메시지 수정
   */
  async updateMessage(messageId: string, content: string): Promise<ChatMessage> {
    const response = await authFetch(`/api/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },

  /**
   * 메시지 삭제 (소프트 삭제)
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    const response = await authFetch(`/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },
};

// ============================================================================
// AI Chat API (SSE Streaming) - 새 스키마용
// ============================================================================

export interface ChatStreamCallbacks {
  onMessage: (chunk: string) => void;
  onComplete: (fullMessage: string) => void;
  onError: (error: Error) => void;
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

    (async () => {
      try {
        const response = await authFetch(`/api/conversations/${conversationId}/messages/ai`, {
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

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                callbacks.onComplete(fullMessage);
                return;
              }

              try {
                const parsed = JSON.parse(data);
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
    const response = await authFetch(`/api/conversations/${conversationId}/messages/ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-No-Stream': 'true',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    const data = await response.json();
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
    const response = await authFetch(`/api/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }
  },
};
