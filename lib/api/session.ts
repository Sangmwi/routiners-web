/**
 * AI Session API Layer
 *
 * AI 트레이너 세션 관련 API 함수
 * React Query에 의존하지 않음 - 재사용성과 테스트 용이성 향상
 *
 * @throws {ApiError} 모든 API 에러는 ApiError로 통일
 */

import { ApiError } from '@/lib/types';
import { authFetch } from '@/lib/utils/authFetch';
import {
  AISession,
  AISessionCreateData,
  SessionPurpose,
  SessionStatus,
  SessionSummary,
} from '@/lib/types/routine';
import { api } from './client';

// ============================================================================
// Query Parameters Types
// ============================================================================

export interface SessionListParams {
  purpose?: SessionPurpose;
  status?: SessionStatus;
  limit?: number;
  offset?: number;
}

// ============================================================================
// AI Session API
// ============================================================================

export const sessionApi = {
  /**
   * AI 세션 목록 조회
   *
   * @param params - 필터 파라미터
   * @returns 세션 요약 목록 (최신순)
   */
  async getSessions(params: SessionListParams = {}): Promise<SessionSummary[]> {
    const searchParams = new URLSearchParams();
    if (params.purpose) searchParams.set('purpose', params.purpose);
    if (params.status) searchParams.set('status', params.status);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    const url = `/api/ai/sessions${query ? `?${query}` : ''}`;

    return api.getOrThrow<SessionSummary[]>(url);
  },

  /**
   * 현재 활성 세션 조회 (purpose별로 1개만 존재)
   *
   * @param purpose - 세션 목적 ('workout' | 'meal')
   * @returns 활성 세션 또는 null
   */
  async getActiveSession(purpose: SessionPurpose): Promise<AISession | null> {
    return api.get<AISession>(`/api/ai/sessions/active?purpose=${purpose}`);
  },

  /**
   * 특정 세션 상세 조회
   *
   * @param id - 세션 ID
   * @returns 세션 상세 정보 또는 null
   */
  async getSession(id: string): Promise<AISession | null> {
    return api.get<AISession>(`/api/ai/sessions/${id}`);
  },

  /**
   * 새 AI 세션 생성
   *
   * @param data - 세션 생성 데이터
   * @returns 생성된 세션
   */
  async createSession(data: AISessionCreateData): Promise<AISession> {
    return api.post<AISession>('/api/ai/sessions', data);
  },

  /**
   * 세션 완료 처리
   *
   * @param id - 세션 ID
   * @returns 업데이트된 세션
   */
  async completeSession(id: string): Promise<AISession> {
    return api.post<AISession>(`/api/ai/sessions/${id}/complete`);
  },

  /**
   * 세션 포기 처리
   *
   * @param id - 세션 ID
   * @returns 업데이트된 세션
   */
  async abandonSession(id: string): Promise<AISession> {
    return api.post<AISession>(`/api/ai/sessions/${id}/abandon`);
  },

  /**
   * 세션 삭제
   *
   * @param id - 세션 ID
   * @returns 성공 여부
   */
  async deleteSession(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/api/ai/sessions/${id}`) as Promise<{ success: boolean }>;
  },
};

// ============================================================================
// AI Chat API (SSE Streaming)
// ============================================================================

export interface ChatStreamCallbacks {
  onMessage: (chunk: string) => void;
  onComplete: (fullMessage: string) => void;
  onError: (error: Error) => void;
}

export const chatApi = {
  /**
   * AI 채팅 메시지 전송 (SSE 스트리밍)
   *
   * @param sessionId - 세션 ID
   * @param message - 사용자 메시지
   * @param callbacks - 스트리밍 콜백
   * @returns AbortController (스트림 취소용)
   */
  sendMessage(
    sessionId: string,
    message: string,
    callbacks: ChatStreamCallbacks
  ): AbortController {
    const controller = new AbortController();

    // SSE 스트리밍은 특수 처리 필요 - authFetch 직접 사용
    (async () => {
      try {
        const response = await authFetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message }),
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
                // JSON 파싱 실패 시 무시 (불완전한 청크)
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        }

        callbacks.onComplete(fullMessage);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // 사용자가 취소한 경우
        }
        callbacks.onError(error instanceof Error ? error : new Error('알 수 없는 오류'));
      }
    })();

    return controller;
  },

  /**
   * AI 채팅 메시지 전송 (Non-streaming, 단순 요청용)
   *
   * @param sessionId - 세션 ID
   * @param message - 사용자 메시지
   * @returns AI 응답 메시지
   */
  async sendMessageSync(sessionId: string, message: string): Promise<string> {
    const data = await api.post<{ content: string }>('/api/ai/chat', {
      sessionId,
      message,
    }, {
      headers: { 'X-No-Stream': 'true' },
    });
    return data.content;
  },
};
