'use client';

import { useState, useEffect } from 'react';
import { CameraIcon } from '@phosphor-icons/react';
import { ImageWithFallback } from '@/components/ui/image';
import { ImageSourceDrawer } from '@/components/drawers';
import { useNativeImagePicker } from '@/hooks/webview';
import { useProfileImagesDraft } from '@/hooks/profile';
import type { AddImageResult } from '@/hooks/profile/useProfileImagesDraft';
import type { ImagePickerSource } from '@/lib/webview';
import { validateImageFile } from '@/lib/utils/imageValidation';
import ErrorToast from '@/components/ui/ErrorToast';
import { LoadingSpinner } from '@/components/ui/icons';

interface ProfilePhotoEditProps {
  initialImage?: string;
  isSaving?: boolean;
  onDraftChange?: (draft: ReturnType<typeof useProfileImagesDraft>) => void;
}

/**
 * 단일 원형 프로필 사진 편집
 *
 * 100px 원형 사진 + 카메라 아이콘 오버레이
 * 탭 → ImageSourceDrawer → 네이티브 이미지 피커
 */
export default function ProfilePhotoEdit({
  initialImage,
  isSaving = false,
  onDraftChange,
}: ProfilePhotoEditProps) {
  const draft = useProfileImagesDraft(
    initialImage ? [initialImage] : [],
    { maxImages: 1, isSaving },
  );
  const { images, addImage } = draft;
  const currentImage = images[0]?.displayUrl || null;

  const { pickImage, base64ToFile } = useNativeImagePicker();
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Draft 변경 시 부모에게 알림 (ProfilePhotoGallery 패턴)
  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  // 이미지 소스 선택 후 처리
  const handleSelectSource = async (source: ImagePickerSource) => {
    setIsSourceOpen(false);
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
      const file = base64ToFile(result.base64, result.fileName || 'profile.jpg');

      const validation = validateImageFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || '파일 검증에 실패했어요.');
        setIsProcessing(false);
        return;
      }

      const addResult: AddImageResult = addImage(file, 0);
      if (!addResult.success && addResult.error) {
        setErrorMessage(addResult.error);
      }
    }

    setIsProcessing(false);
  };

  return (
    <>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setIsSourceOpen(true)}
          disabled={isProcessing}
          className="relative w-[100px] h-[100px] group"
        >
          {/* 원형 이미지 영역 (overflow-hidden을 여기에만 적용) */}
          <div className="w-full h-full rounded-full overflow-hidden">
            {currentImage ? (
              <ImageWithFallback
                src={currentImage}
                alt="프로필 사진"
                fill
                sizes="100px"
                className="object-cover"
                optimizePreset="avatarLarge"
              />
            ) : (
              <div className="w-full h-full bg-muted/50 border-2 border-dashed border-border rounded-full" />
            )}

            {/* hover 오버레이 */}
            {isProcessing ? (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                <LoadingSpinner size="lg" variant="current" className="text-white" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-full" />
            )}
          </div>

          {/* 카메라 아이콘 버튼 (원 바깥으로 나올 수 있게 overflow-hidden 밖에 배치) */}
          {!isProcessing && (
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-md">
              <CameraIcon size={16} weight="fill" className="text-primary-foreground" />
            </div>
          )}
        </button>
      </div>

      {errorMessage && (
        <ErrorToast
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      <ImageSourceDrawer
        isOpen={isSourceOpen}
        onClose={() => setIsSourceOpen(false)}
        onSelectCamera={() => handleSelectSource('camera')}
        onSelectGallery={() => handleSelectSource('gallery')}
        isLoading={isProcessing}
      />
    </>
  );
}
