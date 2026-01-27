'use client';

import { POST_CATEGORIES, type PostCategory } from '@/lib/types/community';

// 전체 옵션 추가
const ALL_CATEGORIES = [{ id: 'all', label: '전체' }, ...POST_CATEGORIES];

interface CategoryTabsProps {
  selectedCategory?: PostCategory | 'all';
  onCategoryChange?: (categoryId: string) => void;
}

/**
 * 커뮤니티 카테고리 탭
 */
export default function CategoryTabs({
  selectedCategory = 'all',
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
      {ALL_CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange?.(category.id)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            selectedCategory === category.id
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'bg-card text-muted-foreground hover:bg-primary/5 border border-border/50'
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
