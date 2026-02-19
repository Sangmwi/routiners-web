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

    /** 게시글 댓글 목록 */
    comments: (postId: string) =>
      [...queryKeys.post.all, 'comments', postId] as const,
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

  /**
   * AI Session 관련 Query Keys
   */
  aiSession: {
    /** 모든 aiSession 쿼리의 기본 키 */
    all: ['aiSession'] as const,

    /** 세션 목록 쿼리들의 기본 키 (invalidateQueries용) */
    lists: () => [...queryKeys.aiSession.all, 'list'] as const,

    /** 세션 목록 */
    list: (filters?: AISessionFilters) =>
      [...queryKeys.aiSession.lists(), filters] as const,

    /** 특정 세션 상세 */
    detail: (id: string) => [...queryKeys.aiSession.all, 'detail', id] as const,

    /** 현재 활성 세션 (purpose별) */
    active: (purpose: 'workout' | 'coach') =>
      [...queryKeys.aiSession.all, 'active', purpose] as const,
  },

  /**
   * Fitness Profile 관련 Query Keys
   */
  fitnessProfile: {
    /** 모든 fitnessProfile 쿼리의 기본 키 */
    all: ['fitnessProfile'] as const,

    /** 현재 사용자의 피트니스 프로필 */
    me: () => [...queryKeys.fitnessProfile.all, 'me'] as const,
  },

  /**
   * Coach (범용 AI 코치) 관련 Query Keys
   */
  coach: {
    /** 모든 coach 쿼리의 기본 키 */
    all: ['coach'] as const,

    /** 대화 목록 */
    conversations: () => [...queryKeys.coach.all, 'conversations'] as const,

    /** 특정 대화 상세 */
    conversation: (id: string) =>
      [...queryKeys.coach.all, 'conversation', id] as const,

    /** 대화 메시지 (무한스크롤) */
    messages: (conversationId: string) =>
      [...queryKeys.coach.all, 'messages', conversationId] as const,

    /** 활성 대화 */
    activeConversation: () =>
      [...queryKeys.coach.all, 'active'] as const,
  },

  /**
   * Progress 관련 Query Keys (3대 운동 추이 등)
   */
  progress: {
    /** 모든 progress 쿼리의 기본 키 */
    all: ['progress'] as const,

    /** 진행 현황 요약 */
    summary: (months?: number) =>
      [...queryKeys.progress.all, 'summary', months] as const,
  },

  /**
   * Routine Event 관련 Query Keys
   */
  routineEvent: {
    /** 모든 routineEvent 쿼리의 기본 키 */
    all: ['routineEvent'] as const,

    /** 이벤트 목록 (날짜 범위) */
    list: (filters?: RoutineEventFilters) =>
      [...queryKeys.routineEvent.all, 'list', filters] as const,

    /** 특정 날짜의 이벤트 */
    byDate: (date: string, type?: 'workout' | 'meal') =>
      [...queryKeys.routineEvent.all, 'date', date, type] as const,

    /** 특정 이벤트 상세 */
    detail: (id: string) =>
      [...queryKeys.routineEvent.all, 'detail', id] as const,

    /** 캘린더 뷰용 월별 요약 */
    monthSummary: (year: number, month: number) =>
      [...queryKeys.routineEvent.all, 'month', year, month] as const,
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
  category?: string | 'all';
  authorId?: string;
  search?: string;
  dateRange?: string;
  page?: number;
  limit?: number;
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

export interface AISessionFilters {
  purpose?: 'workout' | 'coach';
  status?: 'active' | 'completed' | 'abandoned';
  limit?: number;
  offset?: number;
}

export interface RoutineEventFilters {
  startDate?: string;
  endDate?: string;
  type?: 'workout' | 'meal';
  status?: 'scheduled' | 'completed' | 'skipped';
  limit?: number;
  offset?: number;
}
