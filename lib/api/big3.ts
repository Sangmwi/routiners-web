/**
 * Big3 API Layer
 *
 * 3대운동 기록 CRUD 관련 API 함수
 *
 * @throws {ApiError} 모든 API 에러는 ApiError로 통일
 */

import type { Big3Record, Big3CreateData, Big3UpdateData, Big3RecordsSummary, Big3LiftType } from '@/lib/types/big3';
import { api } from './client';

const BASE_URL = '/api/big3';

export const big3Api = {
  async getRecords(options?: {
    liftType?: Big3LiftType;
    limit?: number;
    offset?: number;
  }): Promise<Big3Record[]> {
    const params = new URLSearchParams();
    if (options?.liftType) params.set('liftType', options.liftType);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    const qs = params.toString();
    return api.getOrThrow<Big3Record[]>(`${BASE_URL}${qs ? `?${qs}` : ''}`);
  },

  async getRecord(id: string): Promise<Big3Record | null> {
    return api.get<Big3Record>(`${BASE_URL}/${id}`);
  },

  async getSummary(months = 6): Promise<Big3RecordsSummary> {
    return api.getOrThrow<Big3RecordsSummary>(`${BASE_URL}/summary?months=${months}`);
  },

  async getUserSummary(userId: string, months = 6): Promise<Big3RecordsSummary> {
    return api.getOrThrow<Big3RecordsSummary>(`${BASE_URL}/user/${userId}?months=${months}`);
  },

  async createRecord(data: Big3CreateData): Promise<Big3Record> {
    return api.post<Big3Record>(BASE_URL, data);
  },

  async updateRecord(id: string, data: Big3UpdateData): Promise<Big3Record> {
    return api.patch<Big3Record>(`${BASE_URL}/${id}`, data);
  },

  async deleteRecord(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`${BASE_URL}/${id}`) as Promise<{ success: boolean }>;
  },
};
