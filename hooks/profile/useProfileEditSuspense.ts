'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUserProfileSuspense } from './queries';
import { useUpdateProfile } from './mutations';
import { useProfileImagesDraft } from './useProfileImagesDraft';
import { useProfileImageUpload } from './useProfileImageUpload';
import { useModalStore } from '@/lib/stores/modalStore';
import {
  type ProfileFormData,
  userToFormData,
  formDataToUpdateData,
  hasFormChanges,
} from '@/lib/utils/profileUtils';
import type { User } from '@/lib/types';

// ============================================================
// Types
// ============================================================

export interface UseProfileEditSuspenseReturn {
  // User data (항상 존재 - Suspense 보장)
  user: User;

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

  // Change detection
  hasChanges: boolean;
}

// ============================================================
// Hook (Suspense Version)
// ============================================================

/**
 * 프로필 편집 비즈니스 로직 훅 (Suspense 버전)
 *
 * Suspense boundary 내부에서 사용해야 합니다.
 * user 데이터는 항상 존재합니다 (Suspense가 로딩 처리).
 *
 * @example
 * ```tsx
 * function ProfileEditContent() {
 *   const {
 *     user,
 *     formData,
 *     updateFormField,
 *     handleSave,
 *     isSaving,
 *   } = useProfileEditSuspense();
 *   // user는 항상 존재
 * }
 * ```
 */
export function useProfileEditSuspense(): UseProfileEditSuspenseReturn {
  const router = useRouter();

  // ========== Data Fetching (Suspense) ==========

  const { data: user } = useCurrentUserProfileSuspense();
  const updateProfile = useUpdateProfile();

  // ========== Form State ==========

  const [formData, setFormData] = useState<ProfileFormData>(() =>
    userToFormData(user)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [imageHasChanges, setImageHasChanges] = useState(false);

  // ========== Image Handling ==========

  const imageDraftRef = useRef<ReturnType<typeof useProfileImagesDraft> | null>(null);
  const { uploadImages, isUploading, progressPercent } = useProfileImageUpload();

  // 초기 이미지 드래프트 생성
  const imageDraft = useProfileImagesDraft(user.profilePhotoUrl ? [user.profilePhotoUrl] : []);

  // ========== Modal ==========

  const openModal = useModalStore((state) => state.openModal);

  // ========== Computed ==========

  const formChanged = hasFormChanges(formData, user);
  const hasChanges = formChanged || imageHasChanges;

  // ========== Actions ==========

  /**
   * 폼 필드 업데이트
   */
  const updateFormField = <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * 이미지 드래프트 변경 핸들러
   */
  const handleDraftChange = (draft: ReturnType<typeof useProfileImagesDraft>) => {
    imageDraftRef.current = draft;
    setImageHasChanges(draft.hasChanges);
  };

  /**
   * 에러 표시 (커스텀 모달)
   */
  const showError = (message: string) => {
    openModal('alert', {
      title: '오류',
      message,
      buttonText: '확인',
    });
  };

  /**
   * 뒤로가기
   */
  const handleBack = () => {
    const currentFormChanged = hasFormChanges(formData, user);
    const currentImageChanged = imageDraftRef.current?.hasChanges || imageHasChanges;

    if (currentFormChanged || currentImageChanged) {
      openModal('confirm', {
        title: '변경사항 저장 안 함',
        message: '저장하지 않은 변경사항이 있어요.\n정말 나갈까요?',
        confirmText: '나가기',
        cancelText: '계속 편집',
        onConfirm: () => router.back(),
      });
    } else {
      router.back();
    }
  };

  /**
   * 저장하기
   */
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // 1. 이미지 업로드 처리
      let finalImageUrls: string[] | undefined = undefined;
      const draft = imageDraftRef.current;

      if (draft && draft.hasChanges) {
        const changes = draft.getChanges();
        const uploadResult = await uploadImages(changes);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error);
        }

        finalImageUrls = uploadResult.imageUrls || [];
      }

      // 2. 프로필 업데이트 데이터 구성
      const updates = formDataToUpdateData(formData, finalImageUrls?.[0]);

      // 3. 프로필 업데이트 실행
      updateProfile.mutate(updates, {
        onSuccess: () => {
          router.back();
        },
        onError: (err: Error) => {
          console.error('Failed to update profile:', err);
          showError('프로필 저장에 실패했어요. 다시 시도해 주세요.');
          setIsSaving(false);
        },
      });
    } catch (err) {
      console.error('Save failed:', err);
      showError(err instanceof Error ? err.message : '저장에 실패했어요.');
      setIsSaving(false);
    }
  };

  // ========== Return ==========

  return {
    user,
    formData,
    updateFormField,
    imageDraft,
    handleDraftChange,
    handleSave,
    handleBack,
    isSaving: isSaving || isUploading || updateProfile.isPending,
    uploadProgress: progressPercent,
    hasChanges,
  };
}
