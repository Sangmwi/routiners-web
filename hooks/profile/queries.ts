'use client';

import { User } from '@/lib/types';
import { profileApi, profileSearchApi, ProfileSearchFilters, ProfileSearchResult } from '@/lib/api/profile';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useBaseQuery, useConditionalQuery, useSuspenseBaseQuery } from '@/hooks/common';

// ============================================================================
// Standard Query Hooks
// ============================================================================

/**
 * 현재 사용자 프로필 조회
 *
 * @example
 * const { data: user, isPending, error } = useCurrentUserProfile();
 */
export function useCurrentUserProfile() {
  return useBaseQuery(
    queryKeys.user.me(),
    profileApi.getCurrentUserProfile
  );
}

/**
 * 특정 사용자 프로필 조회
 */
export function useUserProfile(userId: string | undefined) {
  return useConditionalQuery(
    queryKeys.user.detail(userId || ''),
    () => profileApi.getUserProfile(userId!),
    userId,
    { staleTime: 'short' }
  );
}

/**
 * 프로필 검색
 */
export function useSearchProfiles(filters?: ProfileSearchFilters) {
  return useBaseQuery<ProfileSearchResult>(
    queryKeys.user.search(filters),
    () => profileSearchApi.searchProfiles(filters || {}),
    { staleTime: 'search' }
  );
}

/**
 * 추천 프로필 조회
 */
export function useRecommendedProfiles(limit: number = 20) {
  return useBaseQuery(
    queryKeys.user.recommendations(limit),
    () => profileSearchApi.getRecommendedProfiles(limit)
  );
}

/**
 * 같은 부대 사용자 조회
 */
export function useSameUnitUsers(unitId: string | undefined, limit: number = 20) {
  return useConditionalQuery(
    queryKeys.user.sameUnit(unitId || '', limit),
    () => profileSearchApi.getSameUnitUsers(unitId!, limit),
    unitId,
    { staleTime: 'medium' }
  );
}

// ============================================================================
// Suspense Query Hooks
// ============================================================================

/**
 * 현재 사용자 프로필 조회 (Suspense)
 *
 * PageLayout과 함께 사용하면 로딩/에러 상태 분기가 불필요합니다.
 *
 * @example
 * function ProfileEditContent() {
 *   const { data: user } = useCurrentUserProfileSuspense();
 *   // user는 항상 존재 (Suspense가 로딩 처리)
 *   return <ProfileEditForm profile={user} />;
 * }
 */
export function useCurrentUserProfileSuspense() {
  return useSuspenseBaseQuery(
    queryKeys.user.me(),
    profileApi.getCurrentUserProfile
  );
}

/**
 * 특정 사용자 프로필 조회 (Suspense)
 *
 * @param userId - 필수: 사용자 ID (Suspense에서는 조건부 쿼리 지양)
 */
export function useUserProfileSuspense(userId: string) {
  return useSuspenseBaseQuery(
    queryKeys.user.detail(userId),
    () => profileApi.getUserProfile(userId),
    { staleTime: 'short' }
  );
}

/**
 * 프로필 검색 (Suspense)
 */
export function useSearchProfilesSuspense(filters?: ProfileSearchFilters) {
  return useSuspenseBaseQuery<ProfileSearchResult>(
    queryKeys.user.search(filters),
    () => profileSearchApi.searchProfiles(filters || {}),
    { staleTime: 'search' }
  );
}

// ============================================================================
// Utility Hooks (Computational)
// ============================================================================

/**
 * 프로필 완성도 계산
 *
 * @param user - User 객체
 * @returns 프로필 완성도 (0-100)
 *
 * @example
 * const { data: user } = useCurrentUserProfile();
 * const progress = useProfileProgress(user);
 */
export function useProfileProgress(user: User | null | undefined): number {
  if (!user) return 0;

  const fields = [
    user.profileImages?.[0],
    user.bio,
    user.height,
    user.weight,
    user.muscleMass,
    user.bodyFatPercentage,
    user.interestedExercises?.length,
    user.interestedLocations?.length,
    user.isSmoker !== undefined,
  ];

  const filledFields = fields.filter(Boolean).length;
  const totalFields = fields.length;

  return Math.round((filledFields / totalFields) * 100);
}

/**
 * 프로필 유사도 계산 (두 사용자 간)
 *
 * @param user1 - 첫 번째 사용자
 * @param user2 - 두 번째 사용자
 * @returns 유사도 점수 (0-100)
 *
 * @example
 * const similarity = useProfileSimilarity(currentUser, targetUser);
 */
export function useProfileSimilarity(
  user1: User | null | undefined,
  user2: User | null | undefined
): number {
  if (!user1 || !user2) return 0;

  let score = 0;
  let maxScore = 0;

  // 같은 부대 (40점)
  maxScore += 40;
  if (user1.unitId === user2.unitId) {
    score += 40;
  }

  // 관심 운동 겹침 (30점)
  maxScore += 30;
  const commonExercises = user1.interestedExercises?.filter((ex) =>
    user2.interestedExercises?.includes(ex)
  ).length || 0;
  const totalExercises = Math.max(
    user1.interestedExercises?.length || 0,
    user2.interestedExercises?.length || 0
  );
  if (totalExercises > 0) {
    score += (commonExercises / totalExercises) * 30;
  }

  // 관심 장소 겹침 (20점)
  maxScore += 20;
  const commonLocations = user1.interestedLocations?.filter((loc) =>
    user2.interestedLocations?.includes(loc)
  ).length || 0;
  const totalLocations = Math.max(
    user1.interestedLocations?.length || 0,
    user2.interestedLocations?.length || 0
  );
  if (totalLocations > 0) {
    score += (commonLocations / totalLocations) * 20;
  }

  // 체격 유사도 (10점)
  maxScore += 10;
  if (user1.height && user2.height && user1.weight && user2.weight) {
    const heightDiff = Math.abs(user1.height - user2.height);
    const weightDiff = Math.abs(user1.weight - user2.weight);

    // 신장 5cm, 체중 5kg 이내면 만점
    const heightScore = Math.max(0, 5 - heightDiff) / 5 * 5;
    const weightScore = Math.max(0, 5 - weightDiff) / 5 * 5;
    score += heightScore + weightScore;
  }

  return Math.round((score / maxScore) * 100);
}
