/**
 * Progress API Layer
 *
 * 운동 진행 현황 (3대 운동 등) 관련 API 함수
 */

import type { ProgressSummary } from '@/lib/types/progress';
import { api } from './client';

const BASE_URL = '/api/routine/events/stats/progress';

export type UserProgressResponse = ProgressSummary & { isPrivate: boolean };

export const progressApi = {
  /**
   * 운동 진행 현황 요약 조회
   *
   * @param months - 조회 기간 (기본 6개월, 최대 24개월)
   * @returns 3대 운동 추이 등 진행 현황
   */
  async getSummary(months = 6): Promise<ProgressSummary> {
    return api.getOrThrow<ProgressSummary>(`${BASE_URL}?months=${months}`);
  },

  /**
   * 특정 사용자의 운동 진행 현황 조회
   */
  async getUserSummary(userId: string, months = 6): Promise<UserProgressResponse> {
    return api.getOrThrow<UserProgressResponse>(`${BASE_URL}/user/${userId}?months=${months}`);
  },
};
