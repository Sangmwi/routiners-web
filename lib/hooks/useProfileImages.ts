'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { queryKeys } from '@/lib/constants/queryKeys';
import { compressImage, isImageFile, formatFileSize } from '@/lib/utils/imageCompression';
import { fetchWithRetry, getUploadErrorMessage } from '@/lib/utils/fetchWithRetry';

// ============================================================
// Types
// ============================================================

export type UploadProgress = 'compressing' | 'uploading' | 'retrying';

export interface UploadingState {
  index: number;
  progress: UploadProgress;
  previewUrl?: string;
  retryCount?: number;
}

interface UseProfileImagesOptions {
  maxImages?: number;
  onImagesChange?: (images: string[]) => void;
}

interface UseProfileImagesReturn {
  /** 현재 이미지 목록 */
  images: string[];
  /** 업로드 상태 */
  uploadingState: UploadingState | null;
  /** 삭제 중인 인덱스 */
  deletingIndex: number | null;
  /** 파일 선택 처리 */
  handleFileSelect: (file: File, targetIndex: number) => Promise<void>;
  /** 이미지 삭제 */
  handleDelete: (index: number) => Promise<void>;
  /** 이미지 순서 변경 */
  handleReorder: (fromIndex: number, toIndex: number) => Promise<void>;
  /** 외부에서 이미지 동기화 */
  syncImages: (newImages: string[]) => void;
}

// ============================================================
// Constants
// ============================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  quality: 0.8,
};

// ============================================================
// Hook
// ============================================================

/**
 * 프로필 이미지 관리 훅
 *
 * 업로드, 삭제, 순서 변경 기능을 제공하며,
 * 낙관적 업데이트와 React Query 캐시 동기화를 처리합니다.
 *
 * @example
 * ```tsx
 * const {
 *   images,
 *   uploadingState,
 *   handleFileSelect,
 *   handleDelete,
 *   handleReorder,
 * } = useProfileImages({
 *   initialImages: user.profileImages,
 *   onImagesChange: setProfileImages,
 * });
 * ```
 */
export function useProfileImages(
  initialImages: string[] = [],
  options: UseProfileImagesOptions = {}
): UseProfileImagesReturn {
  const { onImagesChange } = options;

  const queryClient = useQueryClient();
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploadingState, setUploadingState] = useState<UploadingState | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  // Blob URL 관리
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    };
  }, []);

  // React Query 캐시 업데이트
  const updateUserCache = useCallback(
    (newProfileImages: string[]) => {
      queryClient.setQueryData<User>(queryKeys.user.me(), (oldUser) => {
        if (!oldUser) return oldUser;
        return { ...oldUser, profileImages: newProfileImages };
      });
    },
    [queryClient]
  );

  // 이미지 상태 업데이트 헬퍼
  const updateImages = useCallback(
    (newImages: string[]) => {
      setImages(newImages);
      onImagesChange?.(newImages);
    },
    [onImagesChange]
  );

  // 외부에서 이미지 동기화
  const syncImages = useCallback(
    (newImages: string[]) => {
      // 업로드/삭제 중이 아닐 때만 동기화
      if (!uploadingState && deletingIndex === null) {
        setImages(newImages);
      }
    },
    [uploadingState, deletingIndex]
  );

  // 파일 선택 및 업로드
  const handleFileSelect = useCallback(
    async (file: File, targetIndex: number) => {
      // 파일 검증
      if (!isImageFile(file)) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
      }

      // 낙관적 업데이트: 미리보기 생성
      const previewUrl = URL.createObjectURL(file);
      blobUrlsRef.current.add(previewUrl);

      const optimisticImages = [...images];
      while (optimisticImages.length <= targetIndex) {
        optimisticImages.push('');
      }
      optimisticImages[targetIndex] = previewUrl;
      const filteredOptimistic = optimisticImages.filter(Boolean);

      updateImages(filteredOptimistic);
      setUploadingState({
        index: targetIndex,
        progress: 'compressing',
        previewUrl,
        retryCount: 0,
      });

      try {
        // 이미지 압축
        console.log(`압축 전 크기: ${formatFileSize(file.size)}`);
        const compressedFile = await compressImage(file, COMPRESSION_OPTIONS);
        console.log(`압축 후 크기: ${formatFileSize(compressedFile.size)}`);

        setUploadingState((prev) =>
          prev ? { ...prev, progress: 'uploading' } : null
        );

        // 업로드
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('index', targetIndex.toString());

        const response = await fetchWithRetry('/api/user/profile/image', {
          method: 'POST',
          credentials: 'include',
          body: formData,
          onRetry: (count) => {
            setUploadingState((prev) =>
              prev ? { ...prev, progress: 'retrying', retryCount: count } : null
            );
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // 미리보기 URL 정리
        URL.revokeObjectURL(previewUrl);
        blobUrlsRef.current.delete(previewUrl);

        // 서버 응답으로 업데이트
        updateImages(data.profileImages);
        updateUserCache(data.profileImages);
      } catch (error) {
        console.error('Failed to upload photo:', error);

        // Rollback
        URL.revokeObjectURL(previewUrl);
        blobUrlsRef.current.delete(previewUrl);
        updateImages(initialImages);

        alert(getUploadErrorMessage(error));
      } finally {
        setUploadingState(null);
      }
    },
    [images, initialImages, updateImages, updateUserCache]
  );

  // 이미지 삭제
  const handleDelete = useCallback(
    async (index: number) => {
      const imageUrl = images[index];
      if (!imageUrl) return;

      if (!confirm('이 사진을 삭제하시겠습니까?')) return;

      // 낙관적 업데이트
      const optimisticImages = images.filter((_, i) => i !== index);
      updateImages(optimisticImages);
      setDeletingIndex(index);

      try {
        const response = await fetch('/api/user/profile/image', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ imageUrl }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Delete failed');
        }

        const data = await response.json();
        updateImages(data.profileImages);
        updateUserCache(data.profileImages);
      } catch (error) {
        console.error('Failed to delete photo:', error);
        updateImages(initialImages);
        alert('사진 삭제에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setDeletingIndex(null);
      }
    },
    [images, initialImages, updateImages, updateUserCache]
  );

  // 이미지 순서 변경
  const handleReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      // 낙관적 업데이트
      const newImages = [...images];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      updateImages(newImages);

      try {
        const response = await fetch('/api/user/profile/image', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ profileImages: newImages }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Reorder failed');
        }

        const data = await response.json();
        updateImages(data.profileImages);
        updateUserCache(data.profileImages);
      } catch (error) {
        console.error('Failed to reorder photos:', error);
        updateImages(initialImages);
        alert('순서 변경에 실패했습니다.');
      }
    },
    [images, initialImages, updateImages, updateUserCache]
  );

  return {
    images,
    uploadingState,
    deletingIndex,
    handleFileSelect,
    handleDelete,
    handleReorder,
    syncImages,
  };
}
