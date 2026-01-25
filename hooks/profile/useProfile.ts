'use client';

/**
 * @deprecated 직접 queries.ts와 mutations.ts에서 import하세요.
 *
 * 이 파일은 하위 호환성을 위해 유지됩니다.
 *
 * @example
 * // Before
 * import { useCurrentUserProfile, useUpdateProfile } from '@/hooks/profile/useProfile';
 *
 * // After
 * import { useCurrentUserProfile, useCurrentUserProfileSuspense } from '@/hooks/profile/queries';
 * import { useUpdateProfile } from '@/hooks/profile/mutations';
 */

// Re-export all queries
export {
  useCurrentUserProfile,
  useUserProfile,
  useSearchProfiles,
  useRecommendedProfiles,
  useSameUnitUsers,
  useCurrentUserProfileSuspense,
  useUserProfileSuspense,
  useSearchProfilesSuspense,
  useProfileProgress,
  useProfileSimilarity,
} from './queries';

// Re-export all mutations
export { useUpdateProfile } from './mutations';
