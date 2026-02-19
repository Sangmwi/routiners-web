'use client';

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
        {POST_CATEGORIES.map((cat) => {
          const isSelected = selected === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              disabled={disabled}
              className={`px-3.5 py-2 rounded-full text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
