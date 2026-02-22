'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUserProfile } from './queries';
import { useUpdateProfile } from './mutations';
import { useProfileImagesDraft } from './useProfileImagesDraft';
import { useProfileImageUpload } from './useProfileImageUpload';
import { useModalStore } from '@/lib/stores/modalStore';
import {
  type ProfileFormData,
  INITIAL_FORM_DATA,
  userToFormData,
  formDataToUpdateData,
  hasFormChanges,
} from '@/lib/utils/profileUtils';

// ============================================================
// Types
// ============================================================

export interface UseProfileEditReturn {
  // User data
  user: ReturnType<typeof useCurrentUserProfile>['data'];
  isPending: boolean;
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

  // Change detection
  hasChanges: boolean;
}

// Re-export for backward compatibility
export type { ProfileFormData };

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

  const { data: user, isPending, error } = useCurrentUserProfile();
  const updateProfile = useUpdateProfile();

  // ========== Form State ==========

  const [formData, setFormData] = useState<ProfileFormData>(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [imageHasChanges, setImageHasChanges] = useState(false);

  // ========== Image Handling ==========

  const imageDraftRef = useRef<ReturnType<typeof useProfileImagesDraft> | null>(null);
  const { uploadImages, isUploading, progressPercent } = useProfileImageUpload();

  // 초기 이미지 드래프트 생성 (user가 로드될 때까지 빈 배열)
  const imageDraft = useProfileImagesDraft(user?.profilePhotoUrl ? [user.profilePhotoUrl] : []);

  // ========== Modal ==========

  const openModal = useModalStore((state) => state.openModal);

  // ========== Effects ==========

  // User 데이터 로드 시 form 초기화
  useEffect(() => {
    if (user) {
      setFormData(userToFormData(user));
      setIsFormInitialized(true);
    }
  }, [user]);

  // ========== Computed ==========

  // 폼이 초기화되기 전에는 변경 없음으로 처리 (초기 깜빡임 방지)
  const formChanged = isFormInitialized && user ? hasFormChanges(formData, user) : false;
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
    // 상태 업데이트로 리렌더링 트리거 (저장 버튼 활성화 반영)
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
    const currentFormChanged = user ? hasFormChanges(formData, user) : false;
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
    if (!user) return;

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
      // draft가 없거나 변경이 없으면 finalImageUrls는 undefined → 이미지 필드 업데이트 안 함

      // 2. 프로필 업데이트 데이터 구성 (타입 안전)
      const updates = formDataToUpdateData(formData, finalImageUrls?.[0]);

      // 3. 프로필 업데이트 실행
      updateProfile.mutate(updates, {
        onSuccess: () => {
          // 저장 완료 후 즉시 페이지 이동
          // isSaving을 false로 바꾸지 않음: 캐시 업데이트로 인한 미리보기 깜빡임 방지
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
    // User data
    user,
    isPending,
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

    // Change detection
    hasChanges,
  };
}
