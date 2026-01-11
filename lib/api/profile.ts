/**
 * Profile API Layer
 *
 * Supabase와 통신하는 순수 API 함수들
 * React Query에 의존하지 않음 - 재사용성과 테스트 용이성 향상
 *
 * @throws {ApiError} 모든 API 에러는 ApiError로 통일
 */

import { User, ProfileUpdateData } from '@/lib/types';
import { api } from './client';

/**
 * Profile 조회/수정 관련 API
 */
export const profileApi = {
  /**
   * 현재 사용자 프로필 조회
   *
   * @returns User 또는 null (인증되지 않은 경우)
   * @throws {ApiError} 네트워크 오류 또는 서버 오류 발생 시
   */
  async getCurrentUserProfile(): Promise<User | null> {
    return api.get<User>('/api/user/me');
  },

  /**
   * 특정 사용자 프로필 조회 (공개 정보만)
   *
   * 시간 복잡도: O(1) - indexed user.id lookup
   *
   * @param userId - 조회할 사용자 ID
   * @returns User 또는 null (사용자 없음)
   * @throws {ApiError} 네트워크 오류 또는 서버 오류 발생 시
   */
  async getUserProfile(userId: string): Promise<User | null> {
    return api.get<User>(`/api/user/${userId}`);
  },

  /**
   * 프로필 업데이트
   *
   * 시간 복잡도: O(1) - single row update with indexed id
   *
   * @param data - 업데이트할 프로필 데이터 (부분 업데이트 지원)
   * @returns 업데이트된 User 객체
   * @throws {ApiError} 업데이트 실패 시
   */
  async updateProfile(data: ProfileUpdateData): Promise<User> {
    return api.patch<User>('/api/user/profile', data);
  },
};

/**
 * Profile 검색/필터링 관련 API
 */
export interface ProfileSearchFilters {
  /** 계급 필터 */
  ranks?: string[];
  /** 부대 ID 필터 */
  unitIds?: string[];
  /** 병과 필터 */
  specialties?: string[];
  /** 관심 운동 종목 필터 (OR 조건) */
  interestedExercises?: string[];
  /** 관심 장소 필터 (OR 조건) */
  interestedLocations?: string[];
  /** 신장 범위 (min, max) */
  heightRange?: [number, number];
  /** 체중 범위 (min, max) */
  weightRange?: [number, number];
  /** 흡연 여부 */
  isSmoker?: boolean;
  /** 페이지네이션 */
  page?: number;
  limit?: number;
  /** 정렬 */
  sortBy?: 'recent' | 'similarity';
}

export interface ProfileSearchResult {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export const profileSearchApi = {
  /**
   * 프로필 검색 (복합 필터링)
   *
   * 시간 복잡도 최적화:
   * - O(log n) for indexed fields (unitId, rank, specialty)
   * - O(n) for array contains (interestedExercises, interestedLocations)
   * - 인덱스 활용: user.unitId, user.rank, user.specialty에 B-tree 인덱스
   * - GIN 인덱스: interestedExercises[], interestedLocations[] 배열 검색
   *
   * 총 시간 복잡도: O(log n + m) where m = filtered results
   *
   * @param filters - 검색 필터
   * @returns 검색 결과
   * @throws {ApiError} 검색 실패 시
   */
  async searchProfiles(filters: ProfileSearchFilters): Promise<ProfileSearchResult> {
    const queryParams = new URLSearchParams();

    if (filters.ranks?.length) {
      queryParams.append('ranks', filters.ranks.join(','));
    }
    if (filters.unitIds?.length) {
      queryParams.append('unitIds', filters.unitIds.join(','));
    }
    if (filters.specialties?.length) {
      queryParams.append('specialties', filters.specialties.join(','));
    }
    if (filters.interestedExercises?.length) {
      queryParams.append('interestedExercises', filters.interestedExercises.join(','));
    }
    if (filters.interestedLocations?.length) {
      queryParams.append('interestedLocations', filters.interestedLocations.join(','));
    }
    if (filters.heightRange) {
      queryParams.append('minHeight', filters.heightRange[0].toString());
      queryParams.append('maxHeight', filters.heightRange[1].toString());
    }
    if (filters.weightRange) {
      queryParams.append('minWeight', filters.weightRange[0].toString());
      queryParams.append('maxWeight', filters.weightRange[1].toString());
    }
    if (filters.isSmoker !== undefined) {
      queryParams.append('isSmoker', filters.isSmoker.toString());
    }
    if (filters.page) {
      queryParams.append('page', filters.page.toString());
    }
    if (filters.limit) {
      queryParams.append('limit', filters.limit.toString());
    }
    if (filters.sortBy) {
      queryParams.append('sortBy', filters.sortBy);
    }

    return api.getOrThrow<ProfileSearchResult>(`/api/user/search?${queryParams}`);
  },

  /**
   * 추천 프로필 조회 (현재 사용자 기반)
   *
   * 추천 알고리즘:
   * 1. 같은 부대 (unitId) - 가중치 40%
   * 2. 관심 운동 종목 겹침 - 가중치 30%
   * 3. 관심 장소 겹침 - 가중치 20%
   * 4. 체격 유사도 (신장/체중 10% 이내) - 가중치 10%
   *
   * 시간 복잡도: O(n log n)
   * - n = 전체 사용자 수, 하지만 unitId 인덱스로 먼저 필터링하여 실질적 n 감소
   *
   * @param limit - 반환할 추천 프로필 수 (기본 20)
   * @returns 추천 프로필 목록
   * @throws {ApiError} 조회 실패 시
   */
  async getRecommendedProfiles(limit: number = 20): Promise<User[]> {
    return api.getOrThrow<User[]>(`/api/user/recommendations?limit=${limit}`);
  },

  /**
   * 같은 부대 사용자 목록 조회
   *
   * 시간 복잡도: O(log n) - unitId B-tree 인덱스 활용
   *
   * @param unitId - 부대 ID (현재 사용자 기준)
   * @param limit - 반환 개수
   * @returns 같은 부대 사용자 목록
   * @throws {ApiError} 조회 실패 시
   */
  async getSameUnitUsers(unitId: string, limit: number = 20): Promise<User[]> {
    return api.getOrThrow<User[]>(`/api/user/same-unit?unitId=${unitId}&limit=${limit}`);
  },
};
