'use client';

import { useState } from 'react';
import type { ImageChanges } from './useProfileImagesDraft';
import { authFetch } from '@/lib/utils/authFetch';

// ============================================================
// Types
// ============================================================

export interface UploadResult {
  success: boolean;
  imageUrls?: string[];
  error?: string;
}

export interface UseProfileImageUploadOptions {
  /** 업로드 API 엔드포인트 */
  uploadEndpoint?: string;
  /** 삭제 API 엔드포인트 */
  deleteEndpoint?: string;
}

interface UploadedImage {
  id: string;
  url: string;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_UPLOAD_ENDPOINT = '/api/upload/profile-image';
const DEFAULT_DELETE_ENDPOINT = '/api/user/profile/image';

// ============================================================
// API Functions
// ============================================================

/**
 * 단일 이미지 업로드
 * File 객체를 직접 FormData에 추가하여 업로드
 */
async function uploadSingleImage(
  file: File,
  endpoint: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  const response = await authFetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '이미지 업로드에 실패했어요.');
  }

  const data = await response.json();
  return data.url;
}

/**
 * 단일 이미지 삭제 (백그라운드)
 */
async function deleteSingleImage(
  imageUrl: string,
  endpoint: string
): Promise<void> {
  await authFetch(endpoint, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });
}

// ============================================================
// Hook
// ============================================================

/**
 * 프로필 이미지 업로드 훅
 *
 * 병렬 업로드와 삭제를 처리합니다.
 *
 * @example
 * ```tsx
 * const { uploadImages, isUploading, progress } = useProfileImageUpload();
 *
 * const handleSave = async () => {
 *   const changes = draft.getChanges();
 *   const result = await uploadImages(changes);
 *   if (result.success) {
 *     await updateProfile({ profileImages: result.imageUrls });
 *   }
 * };
 * ```
 */
export function useProfileImageUpload(options: UseProfileImageUploadOptions = {}) {
  const {
    uploadEndpoint = DEFAULT_UPLOAD_ENDPOINT,
    deleteEndpoint = DEFAULT_DELETE_ENDPOINT,
  } = options;

  // ========== State ==========

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // ========== Actions ==========

  /**
   * 이미지 변경사항 처리 (병렬 업로드 + 백그라운드 삭제)
   */
  const uploadImages = async (changes: ImageChanges): Promise<UploadResult> => {
    const { newImages, deletedUrls, finalOrder } = changes;

    // 변경사항 없으면 현재 URL 반환
    if (!changes.hasChanges) {
      return {
        success: true,
        imageUrls: finalOrder
          .map((img) => img.originalUrl || img.displayUrl)
          .filter((url) => !url.startsWith('blob:')),
      };
    }

    setIsUploading(true);
    setProgress({ current: 0, total: newImages.length });

    try {
      // 1. 새 이미지들 병렬 업로드 (File 직접 사용)
      const uploadPromises = newImages.map(async ({ file, id }): Promise<UploadedImage> => {
        const url = await uploadSingleImage(file, uploadEndpoint);
        setProgress((prev) => ({ ...prev, current: prev.current + 1 }));
        return { id, url };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const uploadedMap = new Map(uploadedImages.map(({ id, url }) => [id, url]));

      // 2. 최종 이미지 URL 배열 생성
      const finalImageUrls = finalOrder
        .map((img) => {
          if (img.isNew && uploadedMap.has(img.id)) {
            return uploadedMap.get(img.id)!;
          }
          return img.originalUrl || '';
        })
        .filter(Boolean);

      // 3. 삭제할 이미지들 백그라운드 처리 (실패해도 무시)
      if (deletedUrls.length > 0) {
        Promise.all(
          deletedUrls.map((url) =>
            deleteSingleImage(url, deleteEndpoint).catch(console.error)
          )
        );
      }

      return { success: true, imageUrls: finalImageUrls };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '이미지 업로드에 실패했어요.';
      return { success: false, error: message };
    } finally {
      setIsUploading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  /**
   * 진행률 퍼센트 계산
   */
  const progressPercent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  // ========== Return ==========

  return {
    uploadImages,
    isUploading,
    progress,
    progressPercent,
  };
}
