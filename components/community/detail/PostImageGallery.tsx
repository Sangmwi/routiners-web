'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ImageWithFallback } from '@/components/ui/image';

interface PostImageGalleryProps {
  images: string[];
}

/**
 * 인스타 스타일 이미지 캐러셀
 *
 * - 세로:가로 4:3 비율 (aspect-[3/4])
 * - 좌우 스와이프 (snap-mandatory로 한 장씩)
 * - 하단 dot 인디케이터
 * - 모달 없이 피드에서 바로 원본 표시
 */
export default function PostImageGallery({ images }: PostImageGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (images.length === 0) return null;

  return (
    <div className="relative -mx-(--layout-padding-x)">
      {/* 스크롤 컨테이너 */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {images.map((url, index) => (
          <div
            key={index}
            className="w-full shrink-0 snap-center"
          >
            <div className="relative w-full aspect-[3/4]">
              <ImageWithFallback
                src={url}
                alt={`이미지 ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Dot 인디케이터 */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                idx === activeIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
