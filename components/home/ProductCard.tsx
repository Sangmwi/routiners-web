'use client';

import { ImageWithFallback } from '@/components/ui/image';

interface ProductCardProps {
  brand: string;
  name: string;
  price: number;
  imageUrl?: string;
  badge?: string;
  onClick?: () => void;
}

export default function ProductCard({ brand, name, price, imageUrl, badge, onClick }: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl bg-card overflow-hidden shadow-sm border border-border/30
                 transition-all duration-200 active:scale-[0.98] cursor-pointer
                 hover:shadow-md hover:border-border/60"
    >
      <div className="relative w-full aspect-[4/3] bg-muted/30">
        <ImageWithFallback
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
        />
        {badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full
                           bg-primary text-primary-foreground text-[10px] font-bold">
            {badge}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <p className="text-[11px] text-muted-foreground mb-0.5 tracking-wide line-clamp-1">
          {brand}
        </p>
        <p className="text-[13px] font-medium text-card-foreground mb-2 line-clamp-2 leading-snug min-h-[2.5rem]">
          {name}
        </p>
        <p className="text-[15px] font-bold text-primary tracking-tight">
          {price.toLocaleString()}원
        </p>
      </div>
    </div>
  );
}
