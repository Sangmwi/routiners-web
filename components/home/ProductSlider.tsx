'use client';

import ProductCard from './ProductCard';
import { Carousel } from '@/components/ui/carousel';
import { Product } from '@/lib/types';

interface ProductSliderProps {
  products: Product[];
  onCardClick?: (id: string) => void;
}

/**
 * 상품 카드 캐러셀
 */
export default function ProductSlider({ products, onCardClick }: ProductSliderProps) {
  return (
    <Carousel gap="gap-3" enableDrag fullBleed snap>
      {products.map((product) => (
        <Carousel.Item key={product.id} className="w-64">
          <ProductCard
            brand={product.brand}
            name={product.name}
            price={product.price}
            imageUrl={product.imageUrl}
            onClick={() => onCardClick?.(product.id)}
          />
        </Carousel.Item>
      ))}
    </Carousel>
  );
}
