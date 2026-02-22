/**
 * Fitness Profile Hooks
 *
 * 피트니스 프로필 관련 React Query 훅
 */

export * from './queries';
export * from './mutations';

// ============================================================================
// Utility Functions
// ============================================================================

import { FitnessProfile } from '@/lib/types/fitness';

/**
 * 피트니스 프로필에 데이터가 있는지 확인하는 헬퍼
 *
 * @param profile - 피트니스 프로필
 * @returns 데이터가 있으면 true
 */
export function hasFitnessProfileData(profile: FitnessProfile | undefined): boolean {
  if (!profile) return false;

  return !!(
    profile.fitnessGoal ||
    profile.experienceLevel ||
    profile.preferredDaysPerWeek ||
    profile.sessionDurationMinutes ||
    profile.equipmentAccess ||
    (profile.focusAreas && profile.focusAreas.length > 0) ||
    (profile.injuries && profile.injuries.length > 0) ||
    (profile.preferences && profile.preferences.length > 0) ||
    (profile.restrictions && profile.restrictions.length > 0)
  );
}
