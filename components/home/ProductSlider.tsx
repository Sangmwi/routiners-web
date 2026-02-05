'use client';

import ProductCard from './ProductCard';
import HorizontalSlider from '@/components/ui/HorizontalSlider';
import { Product } from '@/lib/types';

interface ProductSliderProps {
  products: Product[];
  onCardClick?: (id: string) => void;
}

/**
 * 상품 카드 슬라이더
 */
export default function ProductSlider({ products, onCardClick }: ProductSliderProps) {
  return (
    <HorizontalSlider gap="gap-4" enableDrag fullBleed>
      {products.map((product) => (
        <HorizontalSlider.Item key={product.id} className="w-64">
          <ProductCard
            brand={product.brand}
            name={product.name}
            price={product.price}
            imageUrl={product.imageUrl}
            onClick={() => onCardClick?.(product.id)}
          />
        </HorizontalSlider.Item>
      ))}
    </HorizontalSlider>
  );
}
