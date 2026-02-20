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
 * 네이티브 ActionSheet 스타일 바텀시트
 * - 제목 + 설명 헤더
 * - 세로 리스트 (아이콘 + 텍스트)
 * - 스와이프/배경 클릭으로 닫기
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
      <ModalBody className="p-4 pb-safe">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <LoadingSpinner size="xl" />
            <p className="text-sm text-muted-foreground">이미지 처리 중...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 헤더 */}
            <div className="text-center py-1">
              <h3 className="text-base font-semibold text-foreground">사진 선택</h3>
              <p className="text-sm text-muted-foreground mt-1">사진을 어떻게 가져올까요?</p>
            </div>

            {/* 옵션 목록 */}
            <div className="bg-muted/30 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={handleSelectCamera}
                className="w-full flex items-center justify-center gap-3 py-4 px-5 hover:bg-muted/50 active:bg-muted/70 transition-colors"
              >
                <CameraIcon size={22} className="text-muted-foreground" />
                <span className="text-base font-medium text-foreground">카메라로 촬영</span>
              </button>

              <div className="mx-5 border-t border-border/50" />

              <button
                type="button"
                onClick={handleSelectGallery}
                className="w-full flex items-center justify-center gap-3 py-4 px-5 hover:bg-muted/50 active:bg-muted/70 transition-colors"
              >
                <ImageSquareIcon size={22} className="text-muted-foreground" />
                <span className="text-base font-medium text-foreground">앨범에서 선택</span>
              </button>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
