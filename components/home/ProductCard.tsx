'use client';

interface ProductCardProps {
  brand: string;
  description: string;
  price: number;
  imageUrl?: string;
  onClick?: () => void;
}

export default function ProductCard({ brand, description, price, imageUrl, onClick }: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-green-50 cursor-pointer"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={description}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      ) : (
        <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
          <span className="text-xs text-gray-400">이미지</span>
        </div>
      )}
      <p className="text-xs text-muted-foreground mb-1">{brand}</p>
      <p className="text-sm font-medium text-green-900 mb-2 line-clamp-2">{description}</p>
      <p className="text-base font-bold text-primary">₩{price.toLocaleString()}</p>
    </div>
  );
}

