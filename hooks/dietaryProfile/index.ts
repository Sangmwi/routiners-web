/**
 * Dietary Profile Hooks
 *
 * 식단 프로필 관련 React Query 훅
 */

export * from './queries';
export * from './mutations';

// ============================================================================
// Utility Functions
// ============================================================================

import { DietaryProfile } from '@/lib/types/meal';

/**
 * 식단 프로필에 데이터가 있는지 확인하는 헬퍼
 *
 * @param profile - 식단 프로필
 * @returns 데이터가 있으면 true
 */
export function hasDietaryProfileData(profile: DietaryProfile | null | undefined): boolean {
  if (!profile) return false;

  return !!(
    profile.dietaryGoal ||
    profile.dietType ||
    profile.targetCalories ||
    profile.targetProtein ||
    profile.mealsPerDay ||
    (profile.foodRestrictions && profile.foodRestrictions.length > 0) ||
    (profile.availableSources && profile.availableSources.length > 0) ||
    (profile.eatingHabits && profile.eatingHabits.length > 0) ||
    (profile.preferences && profile.preferences.length > 0)
  );
}
