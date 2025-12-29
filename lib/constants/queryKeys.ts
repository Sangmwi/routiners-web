/**
 * React Query Key Factory
 *
 * 모든 Query Key를 중앙에서 관리하여 타입 안전성과 일관성을 보장합니다.
 *
 * @example
 * // 사용법
 * queryKey: queryKeys.user.me()
 * queryKey: queryKeys.user.checkNickname('nickname')
 */

export const queryKeys = {
  /**
   * User 관련 Query Keys
   */
  user: {
    /** 모든 user 쿼리의 기본 키 */
    all: ['user'] as const,

    /** 현재 로그인한 사용자 정보 */
    me: () => [...queryKeys.user.all, 'me'] as const,

    /** 특정 사용자 상세 정보 */
    detail: (id: string) => [...queryKeys.user.all, 'detail', id] as const,

    /** 닉네임 중복 확인 */
    checkNickname: (nickname: string) =>
      [...queryKeys.user.all, 'check-nickname', nickname] as const,

    /** 프로필 검색 */
    search: (filters?: ProfileSearchFilters) =>
      [...queryKeys.user.all, 'search', filters] as const,

    /** 추천 프로필 */
    recommendations: (limit?: number) =>
      [...queryKeys.user.all, 'recommendations', limit] as const,

    /** 같은 부대 사용자 */
    sameUnit: (unitId: string, limit?: number) =>
      [...queryKeys.user.all, 'same-unit', unitId, limit] as const,
  },

  /**
   * Product 관련 Query Keys (PX 상품)
   */
  product: {
    all: ['product'] as const,

    /** 상품 목록 쿼리들의 기본 키 */
    lists: () => [...queryKeys.product.all, 'list'] as const,

    /** 필터링된 상품 목록 */
    list: (filters?: ProductFilters) =>
      [...queryKeys.product.lists(), filters] as const,

    /** 상품 상세 정보 */
    detail: (id: string) => [...queryKeys.product.all, 'detail', id] as const,
  },

  /**
   * Post/Community 관련 Query Keys
   */
  post: {
    all: ['post'] as const,

    /** 게시글 목록 쿼리들의 기본 키 */
    lists: () => [...queryKeys.post.all, 'list'] as const,

    /** 필터링된 게시글 목록 */
    list: (filters?: PostFilters) =>
      [...queryKeys.post.lists(), filters] as const,

    /** 게시글 상세 쿼리들의 기본 키 */
    details: () => [...queryKeys.post.all, 'detail'] as const,

    /** 특정 게시글 상세 */
    detail: (id: string) => [...queryKeys.post.details(), id] as const,
  },

  /**
   * Influencer 관련 Query Keys
   */
  influencer: {
    all: ['influencer'] as const,

    /** 인플루언서 목록 */
    lists: () => [...queryKeys.influencer.all, 'list'] as const,

    /** 필터링된 인플루언서 목록 */
    list: (filters?: InfluencerFilters) =>
      [...queryKeys.influencer.lists(), filters] as const,

    /** 인플루언서 상세 */
    detail: (id: string) =>
      [...queryKeys.influencer.all, 'detail', id] as const,
  },

  /**
   * InBody 관련 Query Keys
   */
  inbody: {
    /** 모든 inbody 쿼리의 기본 키 */
    all: ['inbody'] as const,

    /** InBody 기록 목록 */
    list: (limit?: number, offset?: number) =>
      [...queryKeys.inbody.all, 'list', limit, offset] as const,

    /** 최신 InBody 기록 */
    latest: () => [...queryKeys.inbody.all, 'latest'] as const,

    /** InBody 요약 정보 */
    summary: () => [...queryKeys.inbody.all, 'summary'] as const,

    /** 특정 InBody 기록 상세 */
    detail: (id: string) => [...queryKeys.inbody.all, 'detail', id] as const,

    /** 특정 사용자의 InBody 요약 정보 */
    userSummary: (userId: string) =>
      [...queryKeys.inbody.all, 'user', userId, 'summary'] as const,
  },
} as const;

/**
 * 타입 정의
 */
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface PostFilters {
  category?: string;
  author?: string;
  search?: string;
  page?: number;
}

export interface InfluencerFilters {
  sortBy?: 'votes' | 'recent';
  page?: number;
}

export interface ProfileSearchFilters {
  ranks?: string[];
  unitIds?: string[];
  specialties?: string[];
  interestedExercises?: string[];
  interestedLocations?: string[];
  heightRange?: [number, number];
  weightRange?: [number, number];
  isSmoker?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'similarity';
}
