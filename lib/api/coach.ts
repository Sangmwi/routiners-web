/**
 * Coach API Layer
 *
 * 범용 코치 AI 전용 API 함수
 * - 대화 목록 조회
 * - 메시지 페이지네이션 (무한스크롤)
 * - 대화 생성/관리
 * - 활성 목적 관리
 * - 컨텍스트 요약
 */

import type {
  CoachConversation,
  CoachConversationsResponse,
  CoachMessagePage,
  CreateCoachConversationData,
  UpdateActivePurposeData,
  ActivePurpose,
} from '@/lib/types/coach';
import { api } from './client';

const BASE_URL = '/api/coach/conversations';

// ============================================================================
// Conversation API
// ============================================================================

export const coachApi = {
  /**
   * 코치 대화 목록 조회
   * - 채팅 목록 Drawer용
   * - 최근 순 정렬, 삭제된 대화 제외
   */
  async getConversations(): Promise<CoachConversationsResponse> {
    return api.getOrThrow<CoachConversationsResponse>(BASE_URL);
  },

  /**
   * 특정 코치 대화 조회
   */
  async getConversation(id: string): Promise<CoachConversation | null> {
    return api.get<CoachConversation>(`${BASE_URL}/${id}`);
  },

  /**
   * 새 코치 대화 생성
   * - 기본 type: 'ai', ai_purpose: 'coach'
   */
  async createConversation(data?: CreateCoachConversationData): Promise<CoachConversation> {
    return api.post<CoachConversation>(BASE_URL, data ?? {});
  },

  /**
   * 활성 대화 조회 (가장 최근 active 상태)
   * - 없으면 null 반환
   */
  async getActiveConversation(): Promise<CoachConversation | null> {
    return api.get<CoachConversation>(`${BASE_URL}/active`);
  },

  /**
   * 대화 완료 처리
   */
  async completeConversation(id: string): Promise<CoachConversation> {
    return api.post<CoachConversation>(`${BASE_URL}/${id}/complete`);
  },

  /**
   * 대화 삭제 (소프트 삭제)
   */
  async deleteConversation(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`${BASE_URL}/${id}`) as Promise<{ success: boolean }>;
  },
};

// ============================================================================
// Message API (무한스크롤)
// ============================================================================

export const coachMessageApi = {
  /**
   * 메시지 목록 조회 (페이지네이션)
   * - 최신 메시지부터 역순
   * - cursor: created_at 기준
   */
  async getMessages(
    conversationId: string,
    cursor?: string,
    limit: number = 15
  ): Promise<CoachMessagePage> {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));

    const query = params.toString();
    const url = `${BASE_URL}/${conversationId}/messages${query ? `?${query}` : ''}`;

    return api.getOrThrow<CoachMessagePage>(url);
  },
};

// ============================================================================
// Active Purpose API
// ============================================================================

export const coachPurposeApi = {
  /**
   * 활성 목적 조회
   */
  async getActivePurpose(conversationId: string): Promise<ActivePurpose | null> {
    const response = await api.get<{ activePurpose: ActivePurpose | null }>(
      `${BASE_URL}/${conversationId}/purpose`
    );
    return response?.activePurpose ?? null;
  },

  /**
   * 활성 목적 설정/업데이트
   * - 프로세스 시작 시 호출
   */
  async setActivePurpose(
    conversationId: string,
    data: UpdateActivePurposeData
  ): Promise<CoachConversation> {
    return api.post<CoachConversation>(`${BASE_URL}/${conversationId}/purpose`, data);
  },

  /**
   * 활성 목적 해제
   * - 프로세스 완료/취소 시 호출
   */
  async clearActivePurpose(conversationId: string): Promise<CoachConversation> {
    return api.delete<CoachConversation>(
      `${BASE_URL}/${conversationId}/purpose`
    ) as Promise<CoachConversation>;
  },
};

// ============================================================================
// Context Summarization API
// ============================================================================

export const coachContextApi = {
  /**
   * 컨텍스트 요약 트리거
   * - 수동 요약 트리거 (자동 요약과 별개)
   */
  async triggerSummarization(conversationId: string): Promise<{ success: boolean; summary?: string }> {
    return api.post<{ success: boolean; summary?: string }>(
      `${BASE_URL}/${conversationId}/summarize`
    );
  },

  /**
   * 요약 상태 조회
   */
  async getSummarizationStatus(conversationId: string): Promise<{
    hasSummary: boolean;
    summarizedUntil?: string;
    messageCount: number;
  }> {
    return api.getOrThrow<{
      hasSummary: boolean;
      summarizedUntil?: string;
      messageCount: number;
    }>(`${BASE_URL}/${conversationId}/summarize`);
  },
};

// ============================================================================
// Server-Side Fetch Functions (서버 컴포넌트용)
// ============================================================================

/**
 * 코치 대화 목록 조회 (서버 컴포넌트용)
 * - prefetch에서 사용
 */
export async function fetchCoachConversations(): Promise<CoachConversationsResponse> {
  return coachApi.getConversations();
}

/**
 * 코치 메시지 조회 (서버 컴포넌트용)
 * - prefetch에서 사용
 */
export async function fetchCoachMessages(
  conversationId: string,
  cursor?: string
): Promise<CoachMessagePage> {
  return coachMessageApi.getMessages(conversationId, cursor);
}

/**
 * 활성 코치 대화 조회 (서버 컴포넌트용)
 */
export async function fetchActiveCoachConversation(): Promise<CoachConversation | null> {
  return coachApi.getActiveConversation();
}
