'use client';

import { useState, useCallback } from 'react';
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
 * Data URL을 Blob으로 변환
 * 안드로이드 WebView에서 File 객체 재읽기가 불가능하므로
 * 미리 저장해둔 dataUrl을 사용하여 업로드
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64Data] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  const byteString = atob(base64Data);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: mimeType });
}

/**
 * 단일 이미지 업로드
 * authFetch 사용하여 401 에러 시 세션 갱신 후 재시도
 *
 * @param dataUrl - 이미지의 Data URL (File 대신 사용 - WebView 호환)
 * @param fileName - 원본 파일명
 * @param endpoint - 업로드 API 엔드포인트
 */
async function uploadSingleImage(
  dataUrl: string,
  fileName: string,
  endpoint: string
): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  const formData = new FormData();
  formData.append('file', blob, fileName);

  const response = await authFetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || '이미지 업로드에 실패했습니다.');
  }

  const data = await response.json();
  return data.url;
}

/**
 * 단일 이미지 삭제 (백그라운드)
 * authFetch 사용하여 401 에러 시 세션 갱신 후 재시도
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
   *
   * @param changes - 드래프트에서 가져온 변경사항
   * @returns 최종 이미지 URL 배열
   */
  const uploadImages = useCallback(
    async (changes: ImageChanges): Promise<UploadResult> => {
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
        // 1. 새 이미지들 병렬 업로드 (dataUrl 사용 - WebView에서 File 재읽기 불가)
        const uploadPromises = newImages.map(async ({ file, id, dataUrl }): Promise<UploadedImage> => {
          const url = await uploadSingleImage(dataUrl, file.name, uploadEndpoint);
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
          error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.';
        return { success: false, error: message };
      } finally {
        setIsUploading(false);
        setProgress({ current: 0, total: 0 });
      }
    },
    [uploadEndpoint, deleteEndpoint]
  );

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
