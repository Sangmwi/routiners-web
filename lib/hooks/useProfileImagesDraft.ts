'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { compressImage, isImageFile, formatFileSize } from '@/lib/utils/imageCompression';

// ============================================================
// Types
// ============================================================

export interface DraftImage {
  id: string;
  displayUrl: string;
  originalUrl?: string;
  file?: File;
  isNew: boolean;
}

export interface ImageChanges {
  newImages: { file: File; id: string }[];
  deletedUrls: string[];
  finalOrder: DraftImage[];
  hasChanges: boolean;
}

interface UseProfileImagesDraftOptions {
  maxImages?: number;
  onImagesChange?: (images: DraftImage[]) => void;
}

interface UseProfileImagesDraftReturn {
  images: DraftImage[];
  isProcessing: boolean;
  hasChanges: boolean;
  addImage: (file: File, index: number) => Promise<void>;
  removeImage: (index: number) => void;
  reorderImages: (fromIndex: number, toIndex: number) => void;
  reset: () => void;
  getChanges: () => ImageChanges;
}

// ============================================================
// Constants
// ============================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_IMAGES = 4;
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  quality: 0.8,
};

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

const createDraftFromFile = (file: File, blobUrl: string): DraftImage => ({
  id: generateId(),
  displayUrl: blobUrl,
  file,
  isNew: true,
});

// ============================================================
// Hook
// ============================================================

/**
 * 프로필 이미지 드래프트 관리 훅
 *
 * 로컬 상태만 관리하며, 저장 시 일괄 처리를 위한 데이터를 제공합니다.
 * API 호출은 하지 않습니다.
 */
export function useProfileImagesDraft(
  initialImages: string[] = [],
  options: UseProfileImagesDraftOptions = {}
): UseProfileImagesDraftReturn {
  const { maxImages = DEFAULT_MAX_IMAGES, onImagesChange } = options;

  // 초기 상태 생성
  const createInitialState = useCallback(
    () => initialImages.map(createDraftFromUrl),
    [initialImages]
  );

  const [images, setImages] = useState<DraftImage[]>(createInitialState);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deletedUrls, setDeletedUrls] = useState<string[]>([]);

  // Blob URL 관리
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const initialImagesRef = useRef<string[]>(initialImages);

  // 초기 이미지 변경 시 리셋
  useEffect(() => {
    const hasInitialChanged =
      JSON.stringify(initialImages) !== JSON.stringify(initialImagesRef.current);

    if (hasInitialChanged) {
      initialImagesRef.current = initialImages;
      setImages(initialImages.map(createDraftFromUrl));
      setDeletedUrls([]);
    }
  }, [initialImages]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    };
  }, []);

  // 변경사항 여부 계산
  const hasChanges = useCallback(() => {
    if (deletedUrls.length > 0) return true;
    if (images.some((img) => img.isNew)) return true;

    const currentUrls = images.map((img) => img.originalUrl).filter(Boolean);
    if (currentUrls.length !== initialImagesRef.current.length) return true;

    return currentUrls.some((url, i) => url !== initialImagesRef.current[i]);
  }, [images, deletedUrls]);

  // 이미지 상태 업데이트
  const updateImages = useCallback(
    (newImages: DraftImage[]) => {
      setImages(newImages);
      onImagesChange?.(newImages);
    },
    [onImagesChange]
  );

  // 이미지 추가
  const addImage = useCallback(
    async (file: File, index: number) => {
      if (!isImageFile(file)) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
      }

      setIsProcessing(true);

      try {
        // 이미지 압축
        console.log(`압축 전: ${formatFileSize(file.size)}`);
        const compressedFile = await compressImage(file, COMPRESSION_OPTIONS);
        console.log(`압축 후: ${formatFileSize(compressedFile.size)}`);

        // Blob URL 생성
        const blobUrl = URL.createObjectURL(compressedFile);
        blobUrlsRef.current.add(blobUrl);

        const newDraft = createDraftFromFile(compressedFile, blobUrl);

        setImages((prev) => {
          const newImages = [...prev];

          // 해당 인덱스에 이미지 삽입
          if (index >= newImages.length) {
            newImages.push(newDraft);
          } else {
            // 기존 이미지가 있으면 교체
            const existing = newImages[index];
            if (existing?.originalUrl) {
              setDeletedUrls((urls) => [...urls, existing.originalUrl!]);
            }
            if (existing?.displayUrl.startsWith('blob:')) {
              URL.revokeObjectURL(existing.displayUrl);
              blobUrlsRef.current.delete(existing.displayUrl);
            }
            newImages[index] = newDraft;
          }

          return newImages.slice(0, maxImages);
        });
      } catch (error) {
        console.error('이미지 처리 실패:', error);
        alert('이미지 처리에 실패했습니다.');
      } finally {
        setIsProcessing(false);
      }
    },
    [maxImages]
  );

  // 이미지 삭제
  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (!target) return prev;

      // 기존 이미지면 삭제 목록에 추가
      if (target.originalUrl) {
        setDeletedUrls((urls) => [...urls, target.originalUrl!]);
      }

      // Blob URL 정리
      if (target.displayUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.displayUrl);
        blobUrlsRef.current.delete(target.displayUrl);
      }

      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // 이미지 순서 변경
  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setImages((prev) => {
      const newImages = [...prev];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      return newImages;
    });
  }, []);

  // 초기 상태로 복원
  const reset = useCallback(() => {
    // Blob URL 정리
    images.forEach((img) => {
      if (img.displayUrl.startsWith('blob:')) {
        URL.revokeObjectURL(img.displayUrl);
        blobUrlsRef.current.delete(img.displayUrl);
      }
    });

    setImages(initialImagesRef.current.map(createDraftFromUrl));
    setDeletedUrls([]);
  }, [images]);

  // 저장용 변경사항 반환
  const getChanges = useCallback((): ImageChanges => {
    const newImages = images
      .filter((img) => img.isNew && img.file)
      .map((img) => ({ file: img.file!, id: img.id }));

    return {
      newImages,
      deletedUrls,
      finalOrder: images,
      hasChanges: hasChanges(),
    };
  }, [images, deletedUrls, hasChanges]);

  return {
    images,
    isProcessing,
    hasChanges: hasChanges(),
    addImage,
    removeImage,
    reorderImages,
    reset,
    getChanges,
  };
}
