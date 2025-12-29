'use client';

/**
 * Native Image Picker Hook
 *
 * WebView 환경에서 네이티브 이미지 피커를 사용합니다.
 * 브라우저 환경에서는 기본 file input을 사용합니다.
 *
 * @example
 * const { pickImage, isPickerOpen } = useNativeImagePicker();
 *
 * const handlePickImage = async () => {
 *   const result = await pickImage('both'); // 'camera' | 'gallery' | 'both'
 *   if (result.success && result.base64) {
 *     // base64 이미지 처리
 *   }
 * };
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ImagePickerSource, ImagePickerResult, AppToWebMessage } from '@/lib/webview';
import { useWebViewCore } from './use-webview-core';
import { registerCommandHandler } from './use-webview-commands';

// IMAGE_PICKER_RESULT 타입 추출
type ImagePickerResultMessage = Extract<AppToWebMessage, { type: 'IMAGE_PICKER_RESULT' }>;

// ============================================================================
// Types
// ============================================================================

type PendingRequest = {
  requestId: string;
  resolve: (result: ImagePickerResult) => void;
  reject: (error: Error) => void;
};

// ============================================================================
// Hook
// ============================================================================

export const useNativeImagePicker = () => {
  const { isInWebView, sendMessage } = useWebViewCore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pendingRequestRef = useRef<PendingRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 앱에서 IMAGE_PICKER_RESULT 메시지 수신 (중앙 레지스트리 사용)
  useEffect(() => {
    if (!isInWebView) return;

    const cleanup = registerCommandHandler<ImagePickerResultMessage>(
      'IMAGE_PICKER_RESULT',
      (command) => {
        const { requestId, result } = command;
        const pending = pendingRequestRef.current;

        if (pending && pending.requestId === requestId) {
          setIsPickerOpen(false);
          pending.resolve(result);
          pendingRequestRef.current = null;
        }
      }
    );

    return cleanup;
  }, [isInWebView]);

  /**
   * 네이티브 이미지 피커 호출
   */
  const pickImageNative = useCallback(
    (source: ImagePickerSource): Promise<ImagePickerResult> => {
      return new Promise((resolve, reject) => {
        const requestId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        console.log('[useNativeImagePicker] pickImageNative called, requestId:', requestId, 'source:', source);

        pendingRequestRef.current = { requestId, resolve, reject };
        setIsPickerOpen(true);

        const sent = sendMessage({
          type: 'REQUEST_IMAGE_PICKER',
          requestId,
          source,
        });
        console.log('[useNativeImagePicker] Message sent:', sent);

        if (!sent) {
          console.log('[useNativeImagePicker] Failed to send message');
          setIsPickerOpen(false);
          pendingRequestRef.current = null;
          reject(new Error('Failed to send message to native app'));
        }

        // 타임아웃 (60초)
        setTimeout(() => {
          if (pendingRequestRef.current?.requestId === requestId) {
            setIsPickerOpen(false);
            pendingRequestRef.current = null;
            resolve({ success: false, cancelled: true });
          }
        }, 60000);
      });
    },
    [sendMessage]
  );

  /**
   * 브라우저 환경에서 file input 사용
   */
  const pickImageWeb = useCallback(
    (source: ImagePickerSource): Promise<ImagePickerResult> => {
      return new Promise((resolve) => {
        // 기존 input 제거
        if (fileInputRef.current) {
          document.body.removeChild(fileInputRef.current);
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';

        // 카메라 전용인 경우 capture 속성 추가
        if (source === 'camera') {
          input.capture = 'environment';
        }

        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) {
            resolve({ success: false, cancelled: true });
            return;
          }

          try {
            // File을 base64로 변환
            const base64 = await fileToBase64(file);
            const dimensions = await getImageDimensions(base64);

            resolve({
              success: true,
              base64,
              mimeType: file.type,
              fileName: file.name,
              fileSize: file.size,
              width: dimensions.width,
              height: dimensions.height,
            });
          } catch (error) {
            resolve({
              success: false,
              error: error instanceof Error ? error.message : 'Failed to process image',
            });
          } finally {
            document.body.removeChild(input);
            fileInputRef.current = null;
          }
        };

        input.oncancel = () => {
          resolve({ success: false, cancelled: true });
          document.body.removeChild(input);
          fileInputRef.current = null;
        };

        document.body.appendChild(input);
        fileInputRef.current = input;
        input.click();
      });
    },
    []
  );

  /**
   * 이미지 선택 (환경에 따라 자동 선택)
   */
  const pickImage = useCallback(
    async (source: ImagePickerSource = 'both'): Promise<ImagePickerResult> => {
      console.log('[useNativeImagePicker] pickImage called, isInWebView:', isInWebView);
      if (isInWebView) {
        console.log('[useNativeImagePicker] Using native picker');
        return pickImageNative(source);
      }
      console.log('[useNativeImagePicker] Using web picker');
      return pickImageWeb(source);
    },
    [isInWebView, pickImageNative, pickImageWeb]
  );

  /**
   * base64를 File 객체로 변환
   */
  const base64ToFile = useCallback(
    (base64: string, fileName: string = 'image.jpg'): File => {
      const arr = base64.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], fileName, { type: mime });
    },
    []
  );

  return {
    pickImage,
    isPickerOpen,
    isInWebView,
    base64ToFile,
  };
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * File을 base64 문자열로 변환
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * base64 이미지의 dimensions 가져오기
 */
function getImageDimensions(
  base64: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = base64;
  });
}
