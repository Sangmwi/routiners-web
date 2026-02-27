'use client';

import { useState } from 'react';
import { CameraIcon, XIcon } from '@phosphor-icons/react';
import { ImageWithFallback } from '@/components/ui/image';
import { ImageSourceDrawer } from '@/components/drawers';
import { useNativeImagePicker } from '@/hooks/webview';
import { validateImageFile, compressImage } from '@/lib/utils/imageValidation';
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
      const rawFile = base64ToFile(
        result.base64,
        result.fileName || 'community.jpg',
      );

      const validation = validateImageFile(rawFile);
      if (!validation.valid) {
        setErrorMessage(validation.error || '파일 검증에 실패했어요.');
        setIsProcessing(false);
        return;
      }

      const compressed = await compressImage(rawFile);
      onAddFiles([compressed]);
    }

    setIsProcessing(false);
  };

  const newFilePreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
  const allThumbnails = [
    ...existingUrls.map((url, i) => ({ url, type: 'existing' as const, index: i })),
    ...newFilePreviewUrls.map((url, i) => ({ url, type: 'new' as const, index: i })),
  ];

  return (
    <>
      {/* 카메라 버튼 */}
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        disabled={isProcessing || !canAddMore}
        className="shrink-0 p-2 rounded-full hover:bg-surface-secondary transition-colors disabled:opacity-40"
        aria-label="사진 추가"
      >
        <CameraIcon size={22} className="text-muted-foreground" />
      </button>

      {/* 가로 스크롤 썸네일 */}
      {allThumbnails.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto flex-1 scrollbar-hide py-0.5">
          {allThumbnails.map(({ url, type, index }) => (
            <div
              key={`${type}-${index}`}
              className="relative shrink-0 w-10 h-10 rounded-lg overflow-hidden"
            >
              <ImageWithFallback
                src={url}
                alt={`이미지 ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  type === 'existing'
                    ? onRemoveExisting(index)
                    : onRemoveNew(index)
                }
                className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-foreground/70 flex items-center justify-center"
              >
                <XIcon size={10} className="text-background" weight="bold" />
              </button>
            </div>
          ))}

          {/* 추가 버튼 (이미지가 있고 더 추가 가능할 때) */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              disabled={isProcessing}
              className="shrink-0 w-10 h-10 rounded-lg border border-dashed border-edge-subtle flex items-center justify-center hover:bg-surface-secondary transition-colors disabled:opacity-40"
            >
              <span className="text-hint text-lg leading-none">+</span>
            </button>
          )}
        </div>
      )}

      {/* 이미지 카운터 */}
      {totalCount > 0 && (
        <span className="text-xs text-hint shrink-0 tabular-nums">
          {totalCount}/{maxCount}
        </span>
      )}

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
    </>
  );
}
