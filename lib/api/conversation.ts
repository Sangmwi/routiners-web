/**
 * Conversation API Layer (새 스키마용)
 *
 * conversations + chat_messages 테이블 기반 API
 * AI 채팅과 유저 간 채팅 모두 지원
 *
 * @throws {ApiError} 모든 API 에러는 ApiError로 통일
 */

import { ApiError, InputRequest, RoutinePreviewData } from '@/lib/types';
import { MealPlanPreviewData } from '@/lib/types/meal';
import { authFetch } from '@/lib/utils/authFetch';
import {
  Conversation,
  ConversationCreateData,
  ConversationUpdateData,
  ChatMessage,
  MessageCreateData,
  AISessionCompat,
  ConversationStatus,
  ProfileConfirmationRequest,
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
   * - 활성 세션 없으면 null 반환 (200 + null body)
   */
  async getActiveAIConversation(purpose: SessionPurpose): Promise<AISessionCompat | null> {
    const response = await authFetch(`/api/conversations/ai/active?purpose=${purpose}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json(); // null if no active session
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
   * AI 대화 상세 조회 (메시지 포함)
   * - AI 타입 대화인 경우 메시지가 포함된 AISessionCompat 반환
   */
  async getAISession(id: string): Promise<AISessionCompat | null> {
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

  /**
   * 프로필 확인 메타데이터 클리어
   * - 프로필 확인/수정 UI 응답 후 pending 상태 정리
   */
  async clearProfileConfirmation(id: string): Promise<void> {
    const response = await authFetch(`/api/conversations/${id}/metadata`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearProfileConfirmation: true }),
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
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

export interface MealPlanAppliedEvent {
  previewId: string;
  eventsCreated: number;
  startDate: string;
}

export interface MealPlanProgressEvent {
  progress: number;
  stage: string;
}

export interface ChatStreamCallbacks {
  onMessage: (chunk: string) => void;
  onComplete: (fullMessage: string) => void;
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
  /** 식단 미리보기 표시 */
  onMealPlanPreview?: (preview: MealPlanPreviewData) => void;
  /** 식단 적용 완료 */
  onMealPlanApplied?: (event: MealPlanAppliedEvent) => void;
  /** 식단 생성 진행률 */
  onMealPlanProgress?: (event: MealPlanProgressEvent) => void;
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
                  case 'meal_plan_preview':
                    callbacks.onMealPlanPreview?.(parsed as MealPlanPreviewData);
                    break;
                  case 'meal_plan_applied':
                    callbacks.onMealPlanApplied?.(parsed as MealPlanAppliedEvent);
                    break;
                  case 'meal_plan_progress':
                    callbacks.onMealPlanProgress?.(parsed as MealPlanProgressEvent);
                    break;
                  case 'profile_confirmation':
                    callbacks.onProfileConfirmation?.(parsed as ProfileConfirmationRequest);
                    break;
                  case 'done':
                    callbacks.onComplete(fullMessage);
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
