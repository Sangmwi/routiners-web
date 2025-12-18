'use client';

import { useRef } from 'react';
import InfluencerCard from './InfluencerCard';

interface Influencer {
  id: string;
  author: string;
  title: string;
  imageUrl?: string;
  votes: number;
}

interface InfluencerSliderProps {
  influencers: Influencer[];
  onMoreClick?: () => void;
  onCardClick?: (id: string) => void;
}

export default function InfluencerSlider({ influencers, onMoreClick, onCardClick }: InfluencerSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = 280; // 카드 너비 + gap
    const currentScroll = scrollContainerRef.current.scrollLeft;
    const targetScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  const visibleCount = 5;
  const hasMore = influencers.length > visibleCount;

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {influencers.map((influencer) => (
          <InfluencerCard
            key={influencer.id}
            author={influencer.author}
            title={influencer.title}
            imageUrl={influencer.imageUrl}
            votes={influencer.votes}
            onClick={() => onCardClick?.(influencer.id)}
          />
        ))}
        {hasMore && (
          <div className="flex-shrink-0 w-64 flex items-center justify-center">
            <button
              onClick={onMoreClick}
              className="px-6 py-3 rounded-xl bg-green-100 text-green-700 font-medium hover:bg-green-200 transition-colors"
            >
              더보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

