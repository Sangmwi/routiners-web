'use client';

import { useState } from 'react';
import { BackIcon, NextIcon, CloseIcon } from '@/components/ui/icons';
import type { ModalDataMap } from '@/lib/stores/modalStore';

// ============================================================================
// Types
// ============================================================================

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModalDataMap['imagePreview'];
}

// ============================================================================
// Component
// ============================================================================

/**
 * 이미지 프리뷰 모달
 *
 * 전체 화면으로 이미지를 보여주는 모달
 * 좌우 스와이프/버튼으로 이동 가능
 */
export default function ImagePreviewModal({
  isOpen,
  onClose,
  data,
}: ImagePreviewModalProps) {
  const { images, initialIndex = 0 } = data;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || images.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 닫기 버튼 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
        aria-label="닫기"
      >
        <CloseIcon size="lg" />
      </button>

      {/* 이미지 카운터 */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* 이전 버튼 */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
          aria-label="이전 이미지"
        >
          <BackIcon size="lg" />
        </button>
      )}

      {/* 이미지 */}
      <img
        src={images[currentIndex]}
        alt={`이미지 ${currentIndex + 1}`}
        className="max-h-full max-w-full object-contain"
        draggable={false}
      />

      {/* 다음 버튼 */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
          aria-label="다음 이미지"
        >
          <NextIcon size="lg" />
        </button>
      )}

      {/* 썸네일 인디케이터 */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-white' : 'bg-white/40'
              }`}
              aria-label={`이미지 ${idx + 1}로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
