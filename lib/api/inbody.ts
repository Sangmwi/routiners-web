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
  ApiError,
} from '@/lib/types';
import { authFetch } from '@/lib/utils/authFetch';

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
    const response = await authFetch(
      `/api/inbody?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },

  /**
   * 최신 InBody 기록 조회
   *
   * @returns 가장 최근 InBody 기록 또는 null
   */
  async getLatest(): Promise<InBodyRecord | null> {
    const response = await authFetch('/api/inbody/latest', {
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
   * InBody 요약 정보 조회 (프로필 표시용)
   *
   * @returns 요약 정보 (최신 기록 + 변화량)
   */
  async getSummary(): Promise<InBodySummary> {
    const response = await authFetch('/api/inbody/summary', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.json();
  },

  /**
   * 특정 InBody 기록 조회
   *
   * @param id - InBody 기록 ID
   * @returns InBody 기록 또는 null
   */
  async getRecord(id: string): Promise<InBodyRecord | null> {
    const response = await authFetch(`/api/inbody/${id}`, {
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
   * InBody 기록 생성
   *
   * @param data - 생성할 InBody 데이터
   * @returns 생성된 InBody 기록
   */
  async createRecord(data: InBodyCreateData): Promise<InBodyRecord> {
    const response = await authFetch('/api/inbody', {
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
   * InBody 기록 수정
   *
   * @param id - InBody 기록 ID
   * @param data - 수정할 데이터 (부분 업데이트)
   * @returns 수정된 InBody 기록
   */
  async updateRecord(id: string, data: InBodyUpdateData): Promise<InBodyRecord> {
    const response = await authFetch(`/api/inbody/${id}`, {
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
   * InBody 기록 삭제
   *
   * @param id - InBody 기록 ID
   * @returns 성공 여부
   */
  async deleteRecord(id: string): Promise<{ success: boolean }> {
    const response = await authFetch(`/api/inbody/${id}`, {
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

    const response = await authFetch('/api/inbody/scan', {
      method: 'POST',
      body: formData,
      // Content-Type은 FormData에서 자동 설정됨 (boundary 포함)
    });

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    const result = await response.json();
    return result.data;
  },
};
