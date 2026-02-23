'use client';

import ChipButton from '@/components/ui/ChipButton';
import { POST_CATEGORIES } from '@/lib/types/community';
import type { PostCategory } from '@/lib/types/community';

interface CategorySelectorProps {
  selected: PostCategory;
  onChange: (category: PostCategory) => void;
  disabled?: boolean;
}

export default function CategorySelector({
  selected,
  onChange,
  disabled = false,
}: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">카테고리</label>
      <div className="flex flex-wrap gap-2">
        {POST_CATEGORIES.map((cat) => (
          <ChipButton
            key={cat.id}
            selected={selected === cat.id}
            size="md"
            onClick={() => onChange(cat.id)}
            disabled={disabled}
          >
            {cat.label}
          </ChipButton>
        ))}
      </div>
    </div>
  );
}
