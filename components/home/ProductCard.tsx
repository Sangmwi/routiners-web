'use client';

import { ImageWithFallback } from '@/components/ui/image';

interface ProductCardProps {
  brand: string;
  name: string;
  price: number;
  imageUrl?: string;
  onClick?: () => void;
}

export default function ProductCard({ brand, name, price, imageUrl, onClick }: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl bg-card p-4 shadow-sm transition-colors hover:bg-primary/5 cursor-pointer border border-border/50"
    >
      <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden bg-muted/50">
        <ImageWithFallback
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
        />
      </div>
      <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{brand}</p>
      <p className="text-sm font-medium text-card-foreground mb-2 line-clamp-2 min-h-[2.5rem]">{name}</p>
      <p className="text-base font-bold text-primary">₩{price.toLocaleString()}</p>
    </div>
  );
}

