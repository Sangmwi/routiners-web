'use client';

import { ImageWithFallback } from '@/components/ui/image';
import { useModalStore } from '@/lib/stores/modalStore';

interface PostImageGalleryProps {
  images: string[];
}

export default function PostImageGallery({ images }: PostImageGalleryProps) {
  const openModal = useModalStore((state) => state.openModal);

  const handleImageClick = (index: number) => {
    openModal('imagePreview', { images, initialIndex: index });
  };

  if (images.length === 0) return null;

  // 1장: 전체 너비
  if (images.length === 1) {
    return (
      <div
        className="relative w-full aspect-[4/3] overflow-hidden rounded-xl cursor-pointer"
        onClick={() => handleImageClick(0)}
      >
        <ImageWithFallback
          src={images[0]}
          alt="게시글 이미지"
          fill
          className="object-cover"
        />
      </div>
    );
  }

  // 2장: 2열
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
        {images.map((url, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer"
            onClick={() => handleImageClick(index)}
          >
            <ImageWithFallback
              src={url}
              alt={`이미지 ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
    );
  }

  // 3~4장: 2×2 그리드
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
      {images.slice(0, 4).map((url, index) => (
        <div
          key={index}
          className="relative aspect-square cursor-pointer"
          onClick={() => handleImageClick(index)}
        >
          <ImageWithFallback
            src={url}
            alt={`이미지 ${index + 1}`}
            fill
            className="object-cover"
          />
          {index === 3 && images.length > 4 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-medium">
              +{images.length - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
