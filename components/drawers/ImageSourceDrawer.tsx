'use client';

import { CameraIcon, ImageSquareIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';
import Modal, { ModalBody } from '@/components/ui/Modal';
import OptionSheet, { type OptionItem } from '@/components/ui/OptionSheet';

interface ImageSourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  isLoading?: boolean;
}

type ImageSource = 'camera' | 'gallery';

const IMAGE_SOURCE_OPTIONS: OptionItem<ImageSource>[] = [
  {
    value: 'camera',
    title: '카메라로 촬영',
    icon: <CameraIcon size={22} />,
  },
  {
    value: 'gallery',
    title: '앨범에서 선택',
    icon: <ImageSquareIcon size={22} />,
  },
];

export default function ImageSourceDrawer({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectGallery,
  isLoading = false,
}: ImageSourceDrawerProps) {
  const handleSelect = (value: ImageSource) => {
    if (value === 'camera') onSelectCamera();
    else onSelectGallery();
  };

  if (isLoading) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        position="bottom"
        height="auto"
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        <ModalBody className="p-4 pb-safe">
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <LoadingSpinner size="xl" />
            <p className="text-sm text-muted-foreground">이미지 처리 중...</p>
          </div>
        </ModalBody>
      </Modal>
    );
  }

  return (
    <OptionSheet<ImageSource>
      variant="grouped"
      isOpen={isOpen}
      onClose={onClose}
      title="사진 선택"
      description="사진을 어떻게 가져올까요?"
      options={IMAGE_SOURCE_OPTIONS}
      onSelect={handleSelect}
    />
  );
}
