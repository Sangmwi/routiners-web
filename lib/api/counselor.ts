/**
 * Counselor API Layer
 *
 * 범용 상담 AI 전용 API 함수
 * - 대화 목록 조회
 * - 메시지 페이지네이션 (무한스크롤)
 * - 대화 생성/관리
 * - 활성 목적 관리
 * - 컨텍스트 요약
 */

import type {
  CounselorConversation,
  CounselorConversationsResponse,
  CounselorMessagePage,
  CreateCounselorConversationData,
  UpdateActivePurposeData,
  ActivePurpose,
} from '@/lib/types/counselor';
import { api } from './client';

const BASE_URL = '/api/counselor/conversations';

// ============================================================================
// Conversation API
// ============================================================================

export const counselorApi = {
  /**
   * 상담 대화 목록 조회
   * - 채팅 목록 Drawer용
   * - 최근 순 정렬, 삭제된 대화 제외
   */
  async getConversations(): Promise<CounselorConversationsResponse> {
    return api.getOrThrow<CounselorConversationsResponse>(BASE_URL);
  },

  /**
   * 특정 상담 대화 조회
   */
  async getConversation(id: string): Promise<CounselorConversation | null> {
    return api.get<CounselorConversation>(`${BASE_URL}/${id}`);
  },

  /**
   * 새 상담 대화 생성
   * - 기본 type: 'ai', ai_purpose: 'counselor'
   */
  async createConversation(data?: CreateCounselorConversationData): Promise<CounselorConversation> {
    return api.post<CounselorConversation>(BASE_URL, data ?? {});
  },

  /**
   * 활성 대화 조회 (가장 최근 active 상태)
   * - 없으면 null 반환
   */
  async getActiveConversation(): Promise<CounselorConversation | null> {
    return api.get<CounselorConversation>(`${BASE_URL}/active`);
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

export const counselorMessageApi = {
  /**
   * 메시지 목록 조회 (페이지네이션)
   * - 최신 메시지부터 역순
   * - cursor: created_at 기준
   */
  async getMessages(
    conversationId: string,
    cursor?: string,
    limit: number = 15
  ): Promise<CounselorMessagePage> {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));

    const query = params.toString();
    const url = `${BASE_URL}/${conversationId}/messages${query ? `?${query}` : ''}`;

    return api.getOrThrow<CounselorMessagePage>(url);
  },
};

// ============================================================================
// Active Purpose API
// ============================================================================

export const counselorPurposeApi = {
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
  ): Promise<CounselorConversation> {
    return api.post<CounselorConversation>(`${BASE_URL}/${conversationId}/purpose`, data);
  },

  /**
   * 활성 목적 해제
   * - 프로세스 완료/취소 시 호출
   */
  async clearActivePurpose(conversationId: string): Promise<CounselorConversation> {
    return api.delete<CounselorConversation>(
      `${BASE_URL}/${conversationId}/purpose`
    ) as Promise<CounselorConversation>;
  },
};

// ============================================================================
// Context Summarization API
// ============================================================================

export const counselorContextApi = {
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
 * 상담 대화 목록 조회 (서버 컴포넌트용)
 * - prefetch에서 사용
 */
export async function fetchCounselorConversations(): Promise<CounselorConversationsResponse> {
  return counselorApi.getConversations();
}

/**
 * 상담 메시지 조회 (서버 컴포넌트용)
 * - prefetch에서 사용
 */
export async function fetchCounselorMessages(
  conversationId: string,
  cursor?: string
): Promise<CounselorMessagePage> {
  return counselorMessageApi.getMessages(conversationId, cursor);
}

/**
 * 활성 상담 대화 조회 (서버 컴포넌트용)
 */
export async function fetchActiveCounselorConversation(): Promise<CounselorConversation | null> {
  return counselorApi.getActiveConversation();
}
