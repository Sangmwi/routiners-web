'use client';

import { useState } from 'react';
import { CameraIcon, XCircleIcon } from '@phosphor-icons/react';
import { ImageWithFallback } from '@/components/ui/image';
import { ImageSourceDrawer } from '@/components/drawers';
import { useNativeImagePicker } from '@/hooks/webview';
import { validateImageFile } from '@/lib/utils/imageValidation';
import type { ImagePickerSource } from '@/lib/webview';
import ErrorToast from '@/components/ui/ErrorToast';

interface ImageUploaderProps {
  existingUrls: string[];
  newFiles: File[];
  maxCount: number;
  onAddFiles: (files: File[]) => void;
  onRemoveExisting: (index: number) => void;
  onRemoveNew: (index: number) => void;
}

export default function ImageUploader({
  existingUrls,
  newFiles,
  maxCount,
  onAddFiles,
  onRemoveExisting,
  onRemoveNew,
}: ImageUploaderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { pickImage, base64ToFile } = useNativeImagePicker();

  const totalCount = existingUrls.length + newFiles.length;
  const canAddMore = totalCount < maxCount;

  const handleSelectSource = async (source: ImagePickerSource) => {
    setIsDrawerOpen(false);
    setIsProcessing(true);

    const result = await pickImage(source);

    if (result.cancelled) {
      setIsProcessing(false);
      return;
    }

    if (!result.success) {
      setErrorMessage(result.error || '이미지 선택에 실패했어요.');
      setIsProcessing(false);
      return;
    }

    if (result.base64) {
      const file = base64ToFile(
        result.base64,
        result.fileName || 'community.jpg',
      );

      const validation = validateImageFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || '파일 검증에 실패했어요.');
        setIsProcessing(false);
        return;
      }

      onAddFiles([file]);
    }

    setIsProcessing(false);
  };

  // 새 파일의 미리보기 URL 생성
  const newFilePreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        사진 ({totalCount}/{maxCount})
      </label>

      <div className="grid grid-cols-4 gap-2">
        {/* 기존 이미지 */}
        {existingUrls.map((url, index) => (
          <div
            key={`existing-${index}`}
            className="relative aspect-square rounded-xl overflow-hidden"
          >
            <ImageWithFallback
              src={url}
              alt={`이미지 ${index + 1}`}
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => onRemoveExisting(index)}
              className="absolute top-1 right-1 text-white drop-shadow-md"
            >
              <XCircleIcon size={22} weight="fill" />
            </button>
          </div>
        ))}

        {/* 새 파일 미리보기 */}
        {newFilePreviewUrls.map((url, index) => (
          <div
            key={`new-${index}`}
            className="relative aspect-square rounded-xl overflow-hidden"
          >
            <img
              src={url}
              alt={`새 이미지 ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemoveNew(index)}
              className="absolute top-1 right-1 text-white drop-shadow-md"
            >
              <XCircleIcon size={22} weight="fill" />
            </button>
          </div>
        ))}

        {/* 추가 버튼 */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            disabled={isProcessing}
            className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 hover:bg-muted/20 transition-colors disabled:opacity-50"
          >
            <CameraIcon size={24} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">추가</span>
          </button>
        )}
      </div>

      {/* 이미지 소스 선택 드로어 */}
      <ImageSourceDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectCamera={() => handleSelectSource('camera')}
        onSelectGallery={() => handleSelectSource('gallery')}
        isLoading={isProcessing}
      />

      {errorMessage && (
        <ErrorToast
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
}
