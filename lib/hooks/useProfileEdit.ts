'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUserProfile, useUpdateProfile } from './useProfile';
import { useProfileImagesDraft } from './useProfileImagesDraft';
import { useProfileImageUpload } from './useProfileImageUpload';

// ============================================================
// Types
// ============================================================

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

export interface UseProfileEditReturn {
  // User data
  user: ReturnType<typeof useCurrentUserProfile>['data'];
  isLoading: boolean;
  error: ReturnType<typeof useCurrentUserProfile>['error'];

  // Form state
  formData: ProfileFormData;
  updateFormField: <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => void;

  // Image draft
  imageDraft: ReturnType<typeof useProfileImagesDraft>;
  handleDraftChange: (draft: ReturnType<typeof useProfileImagesDraft>) => void;

  // Actions
  handleSave: () => Promise<void>;
  handleBack: () => void;

  // Status
  isSaving: boolean;
  uploadProgress: number;
}

// ============================================================
// Constants
// ============================================================

const INITIAL_FORM_DATA: ProfileFormData = {
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

// ============================================================
// Hook
// ============================================================

/**
 * 프로필 편집 비즈니스 로직 훅
 *
 * 프로필 편집 페이지의 모든 상태와 로직을 캡슐화합니다.
 * UI 컴포넌트는 이 훅을 통해 상태와 액션에 접근합니다.
 *
 * @example
 * ```tsx
 * const {
 *   user,
 *   formData,
 *   updateFormField,
 *   handleSave,
 *   isSaving,
 * } = useProfileEdit();
 *
 * return (
 *   <input
 *     value={formData.nickname}
 *     onChange={(e) => updateFormField('nickname', e.target.value)}
 *   />
 * );
 * ```
 */
export function useProfileEdit(): UseProfileEditReturn {
  const router = useRouter();

  // ========== Data Fetching ==========

  const { data: user, isLoading, error } = useCurrentUserProfile();
  const updateProfile = useUpdateProfile();

  // ========== Form State ==========

  const [formData, setFormData] = useState<ProfileFormData>(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);

  // ========== Image Handling ==========

  const imageDraftRef = useRef<ReturnType<typeof useProfileImagesDraft> | null>(null);
  const { uploadImages, isUploading, progressPercent } = useProfileImageUpload();

  // 초기 이미지 드래프트 생성 (user가 로드될 때까지 빈 배열)
  const imageDraft = useProfileImagesDraft(user?.profileImages || []);

  // ========== Effects ==========

  // User 데이터 로드 시 form 초기화
  useEffect(() => {
    if (user) {
      setFormData({
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
      });
    }
  }, [user]);

  // ========== Actions ==========

  /**
   * 폼 필드 업데이트
   */
  const updateFormField = useCallback(
    <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  /**
   * 이미지 드래프트 변경 핸들러
   */
  const handleDraftChange = useCallback(
    (draft: ReturnType<typeof useProfileImagesDraft>) => {
      imageDraftRef.current = draft;
    },
    []
  );

  /**
   * 뒤로가기
   */
  const handleBack = useCallback(() => {
    const hasImageChanges = imageDraftRef.current?.hasChanges;
    if (hasImageChanges) {
      if (confirm('저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?')) {
        router.back();
      }
    } else {
      router.back();
    }
  }, [router]);

  /**
   * 저장하기
   */
  const handleSave = useCallback(async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      // 1. 이미지 업로드 처리
      let finalImageUrls: string[] = [];
      const draft = imageDraftRef.current;

      if (draft) {
        const changes = draft.getChanges();
        const uploadResult = await uploadImages(changes);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error);
        }

        finalImageUrls = uploadResult.imageUrls || [];
      }

      // 2. 프로필 업데이트 데이터 구성
      const updates: Record<string, unknown> = {
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
        profileImages: finalImageUrls,
      };

      // 3. 프로필 업데이트 실행
      updateProfile.mutate(updates, {
        onSuccess: () => {
          // 저장 완료 후 페이지 이동 (캐시 업데이트 완료 대기)
          setIsSaving(false);
          router.push('/profile');
        },
        onError: (err: Error) => {
          console.error('Failed to update profile:', err);
          alert('프로필 저장에 실패했습니다. 다시 시도해주세요.');
          setIsSaving(false);
        },
      });
    } catch (err) {
      console.error('Save failed:', err);
      alert(err instanceof Error ? err.message : '저장에 실패했습니다.');
      setIsSaving(false);
    }
  }, [user, formData, uploadImages, updateProfile, router]);

  // ========== Return ==========

  return {
    // User data
    user,
    isLoading,
    error,

    // Form state
    formData,
    updateFormField,

    // Image draft
    imageDraft,
    handleDraftChange,

    // Actions
    handleSave,
    handleBack,

    // Status
    isSaving: isSaving || isUploading || updateProfile.isPending,
    uploadProgress: progressPercent,
  };
}
