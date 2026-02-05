'use client';

import InfluencerCard from './InfluencerCard';
import HorizontalSlider from '@/components/ui/HorizontalSlider';
import { Influencer } from '@/lib/types';

interface InfluencerSliderProps {
  influencers: Influencer[];
  onCardClick?: (id: string) => void;
}

/**
 * 인플루언서 카드 슬라이더
 */
export default function InfluencerSlider({ influencers, onCardClick }: InfluencerSliderProps) {
  return (
    <HorizontalSlider gap="gap-4" enableDrag fullBleed>
      {influencers.map((influencer) => (
        <HorizontalSlider.Item key={influencer.id}>
          <InfluencerCard
            author={influencer.author}
            title={influencer.title}
            imageUrl={influencer.imageUrl}
            votes={influencer.votes}
            onClick={() => onCardClick?.(influencer.id)}
          />
        </HorizontalSlider.Item>
      ))}
    </HorizontalSlider>
  );
}



