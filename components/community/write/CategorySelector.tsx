'use client';

import {
  ChatCircleIcon,
  BarbellIcon,
  ForkKnifeIcon,
  QuestionIcon,
} from '@phosphor-icons/react';
import { POST_CATEGORIES } from '@/lib/types/community';
import type { PostCategory } from '@/lib/types/community';

interface CategorySelectorProps {
  selected: PostCategory;
  onChange: (category: PostCategory) => void;
  disabled?: boolean;
}

const CATEGORY_ICONS = {
  general: ChatCircleIcon,
  workout: BarbellIcon,
  meal: ForkKnifeIcon,
  qna: QuestionIcon,
} as const;

export default function CategorySelector({
  selected,
  onChange,
  disabled = false,
}: CategorySelectorProps) {
  const selectedCategory = POST_CATEGORIES.find((c) => c.id === selected);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-hint-strong uppercase tracking-widest">
        카테고리
      </label>

      {disabled ? (
        /* 수정 모드: 선택된 카테고리만 표시 */
        <div className="flex items-center gap-2">
          {selectedCategory && (() => {
            const Icon = CATEGORY_ICONS[selectedCategory.id];
            return (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-surface-accent text-primary border border-primary/20">
                <Icon size={13} weight="fill" />
                {selectedCategory.label}
              </span>
            );
          })()}
          <span className="text-xs text-hint">카테고리 변경 불가</span>
        </div>
      ) : (
        /* 글쓰기 모드: 전체 칩 표시 */
        <div className="flex flex-wrap gap-2">
          {POST_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            const isSelected = selected === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChange(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-surface-accent text-primary border border-primary/20'
                    : 'bg-surface-muted text-hint-strong hover:bg-muted'
                }`}
              >
                <Icon size={13} weight={isSelected ? 'fill' : 'regular'} />
                {cat.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
