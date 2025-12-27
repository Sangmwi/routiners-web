'use client';

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
      className="flex-shrink-0 w-64 rounded-xl bg-card shadow-sm overflow-hidden transition-colors hover:bg-primary/5 cursor-pointer border border-border/50"
    >
      <div className="relative w-full h-40 bg-muted/50">
        <ImageWithFallback
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1 line-clamp-1">@{author}</p>
        <h3 className="text-sm font-medium text-card-foreground mb-3 line-clamp-2 min-h-[2.5rem]">{title}</h3>
        <div className="flex items-center gap-1">
          <span className="text-sm">👍</span>
          <span className="text-xs text-muted-foreground">{votes} votes</span>
        </div>
      </div>
    </div>
  );
}

