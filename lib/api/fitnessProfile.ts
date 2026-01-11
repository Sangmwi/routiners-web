/**
 * Fitness Profile API Layer
 *
 * 피트니스 프로필(운동 목표, 경험, 선호도 등) 관련 API 함수
 * React Query에 의존하지 않음
 *
 * @throws {ApiError} 모든 API 에러는 ApiError로 통일
 */

import { FitnessProfile, FitnessProfileUpdateData } from '@/lib/types/fitness';
import { api } from './client';

const ENDPOINT = '/api/fitness-profile';

/**
 * Fitness Profile 관련 API
 */
export const fitnessProfileApi = {
  /**
   * 현재 사용자의 피트니스 프로필 조회
   *
   * @returns FitnessProfile 객체 (데이터가 없어도 기본값 반환)
   * @throws {ApiError} 네트워크 오류 또는 서버 오류 발생 시
   */
  async getFitnessProfile(): Promise<FitnessProfile> {
    return api.getOrThrow<FitnessProfile>(ENDPOINT);
  },

  /**
   * 피트니스 프로필 업데이트 (Upsert)
   *
   * @param data - 업데이트할 프로필 데이터 (부분 업데이트 지원)
   * @returns 업데이트된 FitnessProfile 객체
   * @throws {ApiError} 업데이트 실패 시
   */
  async updateFitnessProfile(data: FitnessProfileUpdateData): Promise<FitnessProfile> {
    return api.patch<FitnessProfile>(ENDPOINT, data);
  },

  /**
   * 피트니스 프로필 전체 교체 (PUT)
   *
   * @param data - 전체 프로필 데이터
   * @returns 저장된 FitnessProfile 객체
   * @throws {ApiError} 저장 실패 시
   */
  async replaceFitnessProfile(data: FitnessProfileUpdateData): Promise<FitnessProfile> {
    return api.put<FitnessProfile>(ENDPOINT, data);
  },

  /**
   * 피트니스 프로필 삭제
   *
   * @throws {ApiError} 삭제 실패 시
   */
  async deleteFitnessProfile(): Promise<void> {
    await api.delete(ENDPOINT);
  },
};
