'use client';

import { useState, useRef, useEffect } from 'react';
import { validateImageFile } from '@/lib/utils/imageValidation';

// ============================================================
// Types
// ============================================================

export interface DraftImage {
  /** 고유 식별자 */
  id: string;
  /** 화면에 표시할 URL (blob URL 또는 서버 URL) */
  displayUrl: string;
  /** 원본 서버 URL (기존 이미지인 경우) */
  originalUrl?: string;
  /** 업로드할 파일 (새 이미지인 경우) */
  file?: File;
  /** 새로 추가된 이미지 여부 */
  isNew: boolean;
}

export interface ImageChanges {
  /** 새로 추가된 이미지들 */
  newImages: { file: File; id: string }[];
  /** 삭제된 이미지 URL들 */
  deletedUrls: string[];
  /** 최종 순서 */
  finalOrder: DraftImage[];
  /** 변경사항 존재 여부 */
  hasChanges: boolean;
}

export interface AddImageResult {
  success: boolean;
  error?: string;
}

interface UseProfileImagesDraftOptions {
  maxImages?: number;
  /** 저장 중 여부 - true면 initialImages 변경 무시 */
  isSaving?: boolean;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_MAX_IMAGES = 4;

// ============================================================
// Helpers
// ============================================================

const generateId = () => `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createDraftFromUrl = (url: string): DraftImage => ({
  id: generateId(),
  displayUrl: url,
  originalUrl: url,
  isNew: false,
});

const createDraftFromFile = (file: File): DraftImage => ({
  id: generateId(),
  displayUrl: URL.createObjectURL(file),
  file,
  isNew: true,
});

/**
 * Blob URL 해제 (메모리 누수 방지)
 */
const revokeBlobUrl = (url: string) => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

// ============================================================
// Hook
// ============================================================

/**
 * 프로필 이미지 드래프트 관리 훅
 *
 * 로컬 상태만 관리하며, 저장 시 일괄 처리를 위한 데이터를 제공합니다.
 * Blob URL을 사용하여 메모리 효율적으로 미리보기를 표시합니다.
 *
 * @example
 * ```tsx
 * const { images, addImage, removeImage, getChanges } = useProfileImagesDraft(initialUrls);
 *
 * const handleAdd = (file: File, index: number) => {
 *   const result = addImage(file, index);
 *   if (!result.success) {
 *     showError(result.error);
 *   }
 * };
 * ```
 */
export function useProfileImagesDraft(
  initialImages: string[] = [],
  options: UseProfileImagesDraftOptions = {}
) {
  const { maxImages = DEFAULT_MAX_IMAGES, isSaving = false } = options;

  // ========== State ==========

  const [images, setImages] = useState<DraftImage[]>(() =>
    initialImages.map(createDraftFromUrl)
  );

  const [deletedUrls, setDeletedUrls] = useState<string[]>([]);

  // ========== Refs ==========

  /** 초기 이미지 URL 저장 (변경 감지용) */
  const initialImagesRef = useRef<string[]>(initialImages);

  /** 최신 상태 참조 (getChanges에서 사용) */
  const imagesRef = useRef<DraftImage[]>(images);
  const deletedUrlsRef = useRef<string[]>(deletedUrls);

  // Ref 동기화
  imagesRef.current = images;
  deletedUrlsRef.current = deletedUrls;

  // ========== Effects ==========

  // 초기 이미지 변경 시 리셋 (저장 중에는 무시)
  useEffect(() => {
    if (isSaving) return;

    const hasInitialChanged =
      JSON.stringify(initialImages) !== JSON.stringify(initialImagesRef.current);

    if (hasInitialChanged) {
      // 기존 blob URL들 해제
      imagesRef.current.forEach((img) => {
        if (img.isNew) revokeBlobUrl(img.displayUrl);
      });

      initialImagesRef.current = initialImages;
      setImages(initialImages.map(createDraftFromUrl));
      setDeletedUrls([]);
    }
  }, [initialImages, isSaving]);

  // 컴포넌트 언마운트 시 모든 blob URL 해제
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        if (img.isNew) revokeBlobUrl(img.displayUrl);
      });
    };
  }, []);

  // ========== Computed ==========

  const hasChanges = () => {
    if (deletedUrls.length > 0) return true;
    if (images.some((img) => img.isNew)) return true;

    const currentUrls = images.map((img) => img.originalUrl).filter(Boolean);
    if (currentUrls.length !== initialImagesRef.current.length) return true;

    return currentUrls.some((url, i) => url !== initialImagesRef.current[i]);
  };

  // ========== Actions ==========

  /**
   * 이미지 추가 (동기 함수)
   */
  const addImage = (file: File, index: number): AddImageResult => {
    // 1. 파일 검증
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 2. 최대 개수 체크
    if (images.length >= maxImages && index >= images.length) {
      return {
        success: false,
        error: `최대 ${maxImages}장까지 업로드할 수 있어요.`,
      };
    }

    // 3. 드래프트 생성 (Blob URL 자동 생성)
    const newDraft = createDraftFromFile(file);

    // 4. 상태 업데이트
    setImages((prev) => {
      const newImages = [...prev];

      // 기존 이미지가 있는 슬롯이면 교체
      if (index < newImages.length && newImages[index]) {
        const existing = newImages[index];

        // 기존 새 이미지의 blob URL 해제
        if (existing.isNew) {
          revokeBlobUrl(existing.displayUrl);
        }

        // 기존 서버 이미지면 삭제 목록에 추가
        if (existing.originalUrl) {
          setDeletedUrls((urls) => [...urls, existing.originalUrl!]);
        }

        newImages[index] = newDraft;
      } else {
        // 빈 슬롯이면 배열 끝에 추가
        newImages.push(newDraft);
      }

      return newImages.slice(0, maxImages);
    });

    return { success: true };
  };

  /**
   * 이미지 삭제
   */
  const removeImage = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (!target) return prev;

      // 새 이미지의 blob URL 해제
      if (target.isNew) {
        revokeBlobUrl(target.displayUrl);
      }

      // 기존 이미지면 삭제 목록에 추가
      if (target.originalUrl) {
        setDeletedUrls((urls) => [...urls, target.originalUrl!]);
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  /**
   * 이미지 순서 변경
   */
  const reorderImages = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setImages((prev) => {
      const newImages = [...prev];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      return newImages;
    });
  };

  /**
   * 초기 상태로 복원
   */
  const reset = () => {
    // 모든 새 이미지의 blob URL 해제
    images.forEach((img) => {
      if (img.isNew) revokeBlobUrl(img.displayUrl);
    });

    setImages(initialImagesRef.current.map(createDraftFromUrl));
    setDeletedUrls([]);
  };

  /**
   * 저장용 변경사항 반환 (항상 최신 상태를 ref에서 읽음)
   */
  const getChanges = (): ImageChanges => {
    const currentImages = imagesRef.current;
    const currentDeletedUrls = deletedUrlsRef.current;

    const newImages = currentImages
      .filter((img) => img.isNew && img.file)
      .map((img) => ({ file: img.file!, id: img.id }));

    // hasChanges 로직 인라인
    const hasAnyChanges = (() => {
      if (currentDeletedUrls.length > 0) return true;
      if (currentImages.some((img) => img.isNew)) return true;

      const currentUrls = currentImages.map((img) => img.originalUrl).filter(Boolean);
      if (currentUrls.length !== initialImagesRef.current.length) return true;

      return currentUrls.some((url, i) => url !== initialImagesRef.current[i]);
    })();

    return {
      newImages,
      deletedUrls: currentDeletedUrls,
      finalOrder: currentImages,
      hasChanges: hasAnyChanges,
    };
  };

  // ========== Return ==========

  return {
    images,
    hasChanges: hasChanges(),
    addImage,
    removeImage,
    reorderImages,
    reset,
    getChanges,
  };
}
