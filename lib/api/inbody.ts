/**
 * InBody API Layer
 *
 * InBody 기록 CRUD 및 AI 스캔 관련 API 함수
 * React Query에 의존하지 않음 - 재사용성과 테스트 용이성 향상
 *
 * @throws {ApiError} 모든 API 에러는 ApiError로 통일
 */

import {
  InBodyRecord,
  InBodyCreateData,
  InBodyUpdateData,
  InBodyExtractedData,
  InBodySummary,
  InBodyListResponse,
} from '@/lib/types';
import { api } from './client';

const BASE_URL = '/api/inbody';

// ============================================================================
// InBody Records API
// ============================================================================

export const inbodyApi = {
  /**
   * InBody 기록 목록 조회
   *
   * @param limit - 조회할 기록 수 (기본 20)
   * @param offset - 오프셋 (페이지네이션)
   * @returns InBody 기록 목록 (최신순)
   */
  async getRecords(limit = 20, offset = 0): Promise<InBodyRecord[]> {
    const res = await api.getOrThrow<InBodyListResponse>(`${BASE_URL}?limit=${limit}&offset=${offset}`);
    return res.records;
  },

  /**
   * InBody 기록 목록 조회 (페이지네이션)
   */
  async fetchRecords(filters: {
    page?: number;
    limit?: number;
  } = {}): Promise<InBodyListResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return api.getOrThrow<InBodyListResponse>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
  },

  /**
   * 최신 InBody 기록 조회
   *
   * @returns 가장 최근 InBody 기록 또는 null
   */
  async getLatest(): Promise<InBodyRecord | null> {
    return api.get<InBodyRecord>(`${BASE_URL}/latest`);
  },

  /**
   * InBody 요약 정보 조회 (프로필 표시용)
   *
   * @returns 요약 정보 (최신 기록 + 변화량)
   */
  async getSummary(): Promise<InBodySummary> {
    return api.getOrThrow<InBodySummary>(`${BASE_URL}/summary`);
  },

  /**
   * 특정 사용자의 InBody 요약 정보 조회
   *
   * @param userId - 조회할 사용자 ID
   * @returns 요약 정보 (공개 설정 시에만 데이터 포함)
   */
  async getUserSummary(userId: string): Promise<InBodySummary> {
    return api.getOrThrow<InBodySummary>(`${BASE_URL}/user/${userId}`);
  },

  /**
   * 특정 InBody 기록 조회
   *
   * @param id - InBody 기록 ID
   * @returns InBody 기록 또는 null
   */
  async getRecord(id: string): Promise<InBodyRecord | null> {
    return api.get<InBodyRecord>(`${BASE_URL}/${id}`);
  },

  /**
   * InBody 기록 생성
   *
   * @param data - 생성할 InBody 데이터
   * @returns 생성된 InBody 기록
   */
  async createRecord(data: InBodyCreateData): Promise<InBodyRecord> {
    return api.post<InBodyRecord>(BASE_URL, data);
  },

  /**
   * InBody 기록 수정
   *
   * @param id - InBody 기록 ID
   * @param data - 수정할 데이터 (부분 업데이트)
   * @returns 수정된 InBody 기록
   */
  async updateRecord(id: string, data: InBodyUpdateData): Promise<InBodyRecord> {
    return api.patch<InBodyRecord>(`${BASE_URL}/${id}`, data);
  },

  /**
   * InBody 기록 삭제
   *
   * @param id - InBody 기록 ID
   * @returns 성공 여부
   */
  async deleteRecord(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`${BASE_URL}/${id}`) as Promise<{ success: boolean }>;
  },
};

// ============================================================================
// InBody Scan API (AI Vision)
// ============================================================================

export const inbodyScanApi = {
  /**
   * InBody 결과지 이미지 스캔 (AI 데이터 추출)
   *
   * @param imageFile - InBody 결과지 이미지 파일
   * @returns 추출된 InBody 데이터
   * @throws {ApiError} 스캔 실패 시
   */
  async scanImage(imageFile: File): Promise<InBodyExtractedData> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const result = await api.post<{ data: InBodyExtractedData }>(`${BASE_URL}/scan`, formData);
    return result.data;
  },
};
