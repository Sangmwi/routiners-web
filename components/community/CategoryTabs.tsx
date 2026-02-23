'use client';

import ChipButton from '@/components/ui/ChipButton';
import type { PostCategory } from '@/lib/types/community';

// 서브탭용 축약 라벨
const ALL_CATEGORIES: { id: PostCategory | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'general', label: '자유' },
  { id: 'workout', label: '운동인증' },
  { id: 'meal', label: '식단' },
  { id: 'qna', label: 'Q&A' },
];

interface CategoryTabsProps {
  selectedCategory?: PostCategory | 'all';
  onCategoryChange?: (categoryId: string) => void;
}

/**
 * 커뮤니티 카테고리 서브탭
 */
export default function CategoryTabs({
  selectedCategory = 'all',
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {ALL_CATEGORIES.map((category) => (
        <ChipButton
          key={category.id}
          selected={selectedCategory === category.id}
          onClick={() => onCategoryChange?.(category.id)}
          className={
            selectedCategory === category.id
              ? 'bg-foreground/10 text-foreground text-sm'
              : 'bg-muted/20 hover:bg-muted/40 text-sm'
          }
        >
          {category.label}
        </ChipButton>
      ))}
    </div>
  );
}
