'use client';

import { ThumbsUpIcon } from '@phosphor-icons/react';
import { ImageWithFallback } from '@/components/ui/image';

interface InfluencerCardProps {
  author: string;
  title: string;
  imageUrl?: string;
  votes: number;
  onClick?: () => void;
}

export default function InfluencerCard({ author, title, imageUrl, votes, onClick }: InfluencerCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-64 rounded-2xl bg-card overflow-hidden shadow-sm border border-border/30
                 transition-all duration-200 active:scale-[0.98] cursor-pointer
                 hover:shadow-md"
    >
      <div className="relative w-full aspect-video bg-muted/20">
        <ImageWithFallback
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-16
                        bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center">
            <span className="text-[10px] text-white font-bold">
              {author.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] text-white/90 font-medium drop-shadow-sm">
            @{author}
          </span>
        </div>
      </div>
      <div className="p-3.5">
        <h3 className="text-[13px] font-semibold text-card-foreground mb-2.5
                       line-clamp-2 leading-snug min-h-[2.5rem]">
          {title}
        </h3>
        <div className="flex items-center gap-1.5">
          <ThumbsUpIcon className="w-3.5 h-3.5 text-primary" weight="fill" />
          <span className="text-[12px] font-medium text-muted-foreground">
            {votes.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
