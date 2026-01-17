'use client';

import { CameraIcon, ImageSquareIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';
import Modal, { ModalBody } from '@/components/ui/Modal';

interface ImageSourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  isLoading?: boolean;
}

/**
 * 이미지 소스 선택 드로어
 *
 * 카메라/앨범 선택을 위한 바텀시트
 * - 정사각형 버튼 가로 배치
 * - 취소 버튼 없음 (스와이프/배경 클릭으로 닫기)
 */
export default function ImageSourceDrawer({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectGallery,
  isLoading = false,
}: ImageSourceDrawerProps) {
  const handleSelectCamera = () => {
    if (isLoading) return;
    onSelectCamera();
  };

  const handleSelectGallery = () => {
    if (isLoading) return;
    onSelectGallery();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      showCloseButton={false}
      closeOnBackdrop={!isLoading}
      size="lg"
    >
      <ModalBody className="pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <LoadingSpinner size="xl" />
            <p className="text-sm text-muted-foreground">이미지 처리 중...</p>
          </div>
        ) : (
          <div className="flex gap-3 p-2">
            {/* 카메라 버튼 */}
            <button
              type="button"
              onClick={handleSelectCamera}
              className="flex-1 aspect-square rounded-2xl border-2 border-border bg-muted/50 hover:bg-muted/80 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-3 active:scale-[0.98]"
            >
              <CameraIcon size={40} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">카메라</span>
            </button>

            {/* 앨범 버튼 */}
            <button
              type="button"
              onClick={handleSelectGallery}
              className="flex-1 aspect-square rounded-2xl border-2 border-border bg-muted/50 hover:bg-muted/80 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-3 active:scale-[0.98]"
            >
              <ImageSquareIcon size={40} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">앨범</span>
            </button>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
