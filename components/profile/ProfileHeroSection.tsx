'use client';

import { useState, useRef } from 'react';
import { User } from '@/lib/types';
import { ImageWithFallback } from '@/components/ui/image';
import { useWindowEventListener } from '@/hooks/common/useEventListener';
import { CheckCircleIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

interface ProfileHeroSectionProps {
  user: User;
}

export default function ProfileHeroSection({ user }: ProfileHeroSectionProps) {
  const images = user.profilePhotoUrl ? [user.profilePhotoUrl] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const goToNext = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  };

  const goToPrev = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Swipe threshold of 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    setTouchStart(null);
  };

  // Keyboard navigation
  useWindowEventListener('keydown', (e) => {
    if (images.length <= 1) return;
    if (e.key === 'ArrowLeft') {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
    if (e.key === 'ArrowRight') {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  });

  return (
    <div
      ref={containerRef}
      className="relative h-[600px] rounded-2xl overflow-hidden bg-card"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Images Container */}
      <div
        className="absolute inset-0 flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.length > 0 ? (
          images.map((imageUrl, index) => (
            <div key={index} className="relative w-full h-full flex-shrink-0">
              <ImageWithFallback
                src={imageUrl}
                alt={`${user.nickname} 사진 ${index + 1}`}
                fill
                className="object-cover"
                fallbackClassName="bg-gradient-to-br from-muted via-muted/80 to-muted/60"
                optimizePreset="detail"
              />
            </div>
          ))
        ) : (
          // 이미지가 없을 때도 ImageWithFallback 사용하여 fallback 아이콘 표시
          <div className="relative w-full h-full flex-shrink-0">
            <ImageWithFallback
              src={null}
              alt="프로필 사진 없음"
              fill
              className="object-cover"
              fallbackClassName="bg-gradient-to-br from-muted via-muted/80 to-muted/60"
            />
          </div>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />

      {/* Navigation Arrows (Desktop) */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors hidden sm:block"
            aria-label="이전 사진"
          >
            <CaretLeftIcon size={24} className="text-white" weight="bold" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors hidden sm:block"
            aria-label="다음 사진"
          >
            <CaretRightIcon size={24} className="text-white" weight="bold" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {images.length > 1 && (
        <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`
                h-1 rounded-full transition-all duration-200
                ${index === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'}
              `}
              aria-label={`사진 ${index + 1}로 이동`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {/* Name and Age */}
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-white">
            {user.nickname}, {getAge(user.birthDate)}
          </h1>
          <CheckCircleIcon size={24} className="text-white" weight="fill" />
        </div>

        {/* Military Info */}
        <p className="text-sm text-white/70 mb-3">
          {[user.rank, user.unitName, user.specialty].filter(Boolean).join(' · ')}
        </p>

        {/* Interest Tag */}
        {user.interestedExercises && user.interestedExercises.length > 0 && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-card text-xs text-card-foreground">
            {user.interestedExercises.slice(0, 2).join('/')}
          </div>
        )}
      </div>
    </div>
  );
}
