/**
 * Dietary Profile API Layer
 *
 * 식단 프로필(식단 목표, 유형, 제한사항, 식습관 등) 관련 API 함수
 * React Query에 의존하지 않음
 *
 * @throws {ApiError} 모든 API 에러는 ApiError로 통일
 */

import { DietaryProfile, DietaryProfileUpdateData } from '@/lib/types/meal';
import { api } from './client';

const ENDPOINT = '/api/dietary-profile';

export interface UserDietaryProfileResponse {
  profile: DietaryProfile | null;
  isPrivate: boolean;
}

/**
 * Dietary Profile 관련 API
 */
export const dietaryProfileApi = {
  /**
   * 현재 사용자의 식단 프로필 조회
   *
   * @returns DietaryProfile 객체 또는 null (프로필 없는 경우)
   * @throws {ApiError} 네트워크 오류 또는 서버 오류 발생 시
   */
  async getDietaryProfile(): Promise<DietaryProfile | null> {
    return api.get<DietaryProfile>(ENDPOINT);
  },

  /**
   * 식단 프로필 업데이트 (Upsert)
   *
   * @param data - 업데이트할 프로필 데이터 (부분 업데이트 지원)
   * @returns 업데이트된 DietaryProfile 객체
   * @throws {ApiError} 업데이트 실패 시
   */
  async updateDietaryProfile(data: DietaryProfileUpdateData): Promise<DietaryProfile> {
    return api.put<DietaryProfile>(ENDPOINT, data);
  },

  /**
   * 특정 사용자의 식단 프로필 조회
   */
  async getUserProfile(userId: string): Promise<UserDietaryProfileResponse> {
    return api.getOrThrow<UserDietaryProfileResponse>(`${ENDPOINT}/user/${userId}`);
  },
};
