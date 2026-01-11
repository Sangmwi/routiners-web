/**
 * Routine Event API Layer
 *
 * 루틴 이벤트 (운동/식단 일정) 관련 API 함수
 * React Query에 의존하지 않음 - 재사용성과 테스트 용이성 향상
 *
 * @throws {ApiError} 모든 API 에러는 ApiError로 통일
 */

import {
  RoutineEvent,
  RoutineEventCreateData,
  RoutineEventUpdateData,
  RoutineBatchCreateData,
  EventType,
  EventStatus,
  CalendarEventSummary,
  WorkoutData,
} from '@/lib/types/routine';
import { api } from './client';

// ============================================================================
// Query Parameters Types
// ============================================================================

export interface EventListParams {
  startDate?: string;
  endDate?: string;
  type?: EventType;
  status?: EventStatus;
  limit?: number;
  offset?: number;
}

const BASE_URL = '/api/routine/events';

// ============================================================================
// Routine Event API
// ============================================================================

export const routineEventApi = {
  /**
   * 루틴 이벤트 목록 조회
   *
   * @param params - 필터 파라미터
   * @returns 이벤트 목록 (날짜순)
   */
  async getEvents(params: EventListParams = {}): Promise<RoutineEvent[]> {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.type) searchParams.set('type', params.type);
    if (params.status) searchParams.set('status', params.status);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    const url = `${BASE_URL}${query ? `?${query}` : ''}`;

    return api.getOrThrow<RoutineEvent[]>(url);
  },

  /**
   * 특정 날짜의 이벤트 조회
   *
   * @param date - 날짜 (YYYY-MM-DD)
   * @param type - 이벤트 타입 (optional)
   * @returns 해당 날짜의 이벤트 또는 null
   */
  async getEventByDate(date: string, type?: EventType): Promise<RoutineEvent | null> {
    const params = new URLSearchParams({ date });
    if (type) params.set('type', type);

    return api.get<RoutineEvent>(`${BASE_URL}/by-date?${params}`);
  },

  /**
   * 특정 이벤트 상세 조회
   *
   * @param id - 이벤트 ID
   * @returns 이벤트 상세 정보 또는 null
   */
  async getEvent(id: string): Promise<RoutineEvent | null> {
    return api.get<RoutineEvent>(`${BASE_URL}/${id}`);
  },

  /**
   * 월별 캘린더 요약 조회
   *
   * @param year - 연도
   * @param month - 월 (1-12)
   * @returns 캘린더 이벤트 요약 목록
   */
  async getMonthSummary(year: number, month: number): Promise<CalendarEventSummary[]> {
    return api.getOrThrow<CalendarEventSummary[]>(
      `${BASE_URL}/calendar?year=${year}&month=${month}`
    );
  },

  /**
   * 루틴 이벤트 생성 (단일)
   *
   * @param data - 이벤트 생성 데이터
   * @returns 생성된 이벤트
   */
  async createEvent(data: RoutineEventCreateData): Promise<RoutineEvent> {
    return api.post<RoutineEvent>(BASE_URL, data);
  },

  /**
   * 루틴 이벤트 일괄 생성 (AI 생성 4주치)
   *
   * @param data - 일괄 생성 데이터
   * @returns 생성된 이벤트 목록
   */
  async createEventsBatch(data: RoutineBatchCreateData): Promise<RoutineEvent[]> {
    return api.post<RoutineEvent[]>(`${BASE_URL}/batch`, data);
  },

  /**
   * 루틴 이벤트 수정
   *
   * @param id - 이벤트 ID
   * @param data - 수정할 데이터 (부분 업데이트)
   * @returns 수정된 이벤트
   */
  async updateEvent(id: string, data: RoutineEventUpdateData): Promise<RoutineEvent> {
    return api.patch<RoutineEvent>(`${BASE_URL}/${id}`, data);
  },

  /**
   * 이벤트 완료 처리
   *
   * @param id - 이벤트 ID
   * @returns 업데이트된 이벤트
   */
  async completeEvent(id: string): Promise<RoutineEvent> {
    return api.post<RoutineEvent>(`${BASE_URL}/${id}/complete`);
  },

  /**
   * 이벤트 건너뛰기 처리
   *
   * @param id - 이벤트 ID
   * @returns 업데이트된 이벤트
   */
  async skipEvent(id: string): Promise<RoutineEvent> {
    return api.post<RoutineEvent>(`${BASE_URL}/${id}/skip`);
  },

  /**
   * 이벤트 워크아웃 데이터 업데이트 (실제 수행 기록)
   *
   * @param id - 이벤트 ID
   * @param workoutData - 수정된 워크아웃 데이터
   * @returns 업데이트된 이벤트
   */
  async updateWorkoutData(id: string, workoutData: WorkoutData): Promise<RoutineEvent> {
    return api.patch<RoutineEvent>(`${BASE_URL}/${id}/workout`, { data: workoutData });
  },

  /**
   * 루틴 이벤트 삭제
   *
   * @param id - 이벤트 ID
   * @returns 성공 여부
   */
  async deleteEvent(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`${BASE_URL}/${id}`) as Promise<{ success: boolean }>;
  },

  /**
   * AI 세션과 연결된 이벤트들 삭제
   *
   * @param aiSessionId - AI 세션 ID
   * @returns 삭제된 이벤트 수
   */
  async deleteEventsBySession(aiSessionId: string): Promise<{ count: number }> {
    return api.delete<{ count: number }>(`${BASE_URL}/by-session/${aiSessionId}`) as Promise<{ count: number }>;
  },
};
