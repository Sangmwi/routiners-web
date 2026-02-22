'use client';

import InfluencerCard from './InfluencerCard';
import { Carousel } from '@/components/ui/carousel';
import { Influencer } from '@/lib/types';

interface InfluencerSliderProps {
  influencers: Influencer[];
  onCardClick?: (id: string) => void;
}

/**
 * 인플루언서 카드 캐러셀
 */
export default function InfluencerSlider({ influencers, onCardClick }: InfluencerSliderProps) {
  return (
    <Carousel gap="gap-4" enableDrag fullBleed snap>
      {influencers.map((influencer) => (
        <Carousel.Item key={influencer.id} className='w-64'>
          <InfluencerCard
            author={influencer.author}
            title={influencer.title}
            imageUrl={influencer.imageUrl}
            votes={influencer.votes}
            onClick={() => onCardClick?.(influencer.id)}
          />
        </Carousel.Item>
      ))}
    </Carousel>
  );
}
