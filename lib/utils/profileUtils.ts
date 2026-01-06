/**
 * Profile Utilities
 *
 * 프로필 편집 관련 유틸리티 함수들
 * - 폼 데이터 변환
 * - 변경 감지
 * - 배열 비교
 */

import type { User, ProfileUpdateData } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

/**
 * 프로필 편집 폼 데이터
 *
 * UI에서 문자열로 입력받는 필드들 (height, weight 등)
 * 저장 시 ProfileUpdateData로 변환됨
 */
export interface ProfileFormData {
  nickname: string;
  bio: string;
  height: string;
  weight: string;
  muscleMass: string;
  bodyFatPercentage: string;
  showInbodyPublic: boolean;
  isSmoker: boolean | undefined;
  interestedLocations: string[];
  interestedExercises: string[];
}

/**
 * 폼 데이터 초기값
 */
export const INITIAL_FORM_DATA: ProfileFormData = {
  nickname: '',
  bio: '',
  height: '',
  weight: '',
  muscleMass: '',
  bodyFatPercentage: '',
  showInbodyPublic: true,
  isSmoker: undefined,
  interestedLocations: [],
  interestedExercises: [],
};

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * 두 문자열 배열이 동일한지 비교 (순서 무관)
 */
export function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, i) => val === sortedB[i]);
}

// ============================================================================
// Form Data Transformers
// ============================================================================

/**
 * User 데이터를 폼 데이터로 변환
 *
 * DB에서 가져온 User 객체를 편집 폼에서 사용할 수 있는 형태로 변환
 */
export function userToFormData(user: User): ProfileFormData {
  return {
    nickname: user.nickname || '',
    bio: user.bio || '',
    height: user.height?.toString() || '',
    weight: user.weight?.toString() || '',
    muscleMass: user.muscleMass?.toString() || '',
    bodyFatPercentage: user.bodyFatPercentage?.toString() || '',
    showInbodyPublic: user.showInbodyPublic ?? true,
    isSmoker: user.isSmoker,
    interestedLocations: user.interestedLocations || [],
    interestedExercises: user.interestedExercises || [],
  };
}

/**
 * 폼 데이터를 API 업데이트 데이터로 변환
 *
 * 문자열 필드를 숫자로 변환하고, 빈 값은 undefined로 처리
 *
 * @param formData - 폼 데이터
 * @param imageUrls - 최종 이미지 URL 배열 (undefined면 이미지 필드 업데이트 안 함)
 */
export function formDataToUpdateData(
  formData: ProfileFormData,
  imageUrls?: string[]
): ProfileUpdateData {
  const result: ProfileUpdateData = {
    nickname: formData.nickname.trim() || undefined,
    bio: formData.bio.trim() || undefined,
    height: formData.height ? Number(formData.height) : undefined,
    weight: formData.weight ? Number(formData.weight) : undefined,
    muscleMass: formData.muscleMass ? Number(formData.muscleMass) : undefined,
    bodyFatPercentage: formData.bodyFatPercentage
      ? Number(formData.bodyFatPercentage)
      : undefined,
    showInbodyPublic: formData.showInbodyPublic,
    isSmoker: formData.isSmoker,
    interestedLocations: formData.interestedLocations,
    interestedExercises: formData.interestedExercises,
  };

  // 이미지 배열이 명시적으로 제공된 경우에만 포함
  if (imageUrls !== undefined) {
    result.profileImages = imageUrls;
  }

  return result;
}

// ============================================================================
// Change Detection
// ============================================================================

/**
 * 폼 데이터가 원본 User와 다른지 확인
 */
export function hasFormChanges(formData: ProfileFormData, user: User): boolean {
  return (
    formData.nickname !== (user.nickname || '') ||
    formData.bio !== (user.bio || '') ||
    formData.height !== (user.height?.toString() || '') ||
    formData.weight !== (user.weight?.toString() || '') ||
    formData.muscleMass !== (user.muscleMass?.toString() || '') ||
    formData.bodyFatPercentage !== (user.bodyFatPercentage?.toString() || '') ||
    formData.showInbodyPublic !== (user.showInbodyPublic ?? true) ||
    formData.isSmoker !== user.isSmoker ||
    !arraysEqual(formData.interestedLocations, user.interestedLocations || []) ||
    !arraysEqual(formData.interestedExercises, user.interestedExercises || [])
  );
}
