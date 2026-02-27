'use client';

import { useEffect, useState } from 'react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import ChipButton from '@/components/ui/ChipButton';
import type { PostCategory } from '@/lib/types/community';

export type DateRange = 'all' | 'today' | 'week' | 'month';

const ALL_CATEGORIES: { id: PostCategory | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'general', label: '자유' },
  { id: 'workout', label: '운동인증' },
  { id: 'meal', label: '식단' },
  { id: 'qna', label: 'Q&A' },
];

const DATE_RANGE_OPTIONS: { id: DateRange; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'today', label: '오늘' },
  { id: 'week', label: '이번 주' },
  { id: 'month', label: '이번 달' },
];

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category: PostCategory | 'all';
  onCategoryChange: (cat: PostCategory | 'all') => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export default function FilterSheet({
  isOpen,
  onClose,
  category,
  onCategoryChange,
  dateRange,
  onDateRangeChange,
}: FilterSheetProps) {
  const [draftCategory, setDraftCategory] = useState(category);
  const [draftDateRange, setDraftDateRange] = useState(dateRange);

  // 시트가 열릴 때 현재 적용된 값으로 드래프트 초기화
  useEffect(() => {
    if (isOpen) {
      setDraftCategory(category);
      setDraftDateRange(dateRange);
    }
  }, [isOpen]);

  const handleApply = () => {
    onCategoryChange(draftCategory);
    onDateRangeChange(draftDateRange);
    onClose();
  };

  const handleReset = () => {
    setDraftCategory('all');
    setDraftDateRange('all');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="필터"
      headerAction={
        <button
          onClick={handleReset}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          초기화
        </button>
      }
      position="bottom"
      enableSwipe
      showCloseButton={false}
      stickyFooter={
        <div className="px-5 py-3 pb-safe">
          <button
            type="button"
            onClick={handleApply}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold active:opacity-80 transition-opacity"
          >
            적용하기
          </button>
        </div>
      }
    >
      <ModalBody className="px-5 pt-4 pb-2">
        <div className="space-y-6">
          {/* 카테고리 필터 */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              카테고리
            </span>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((option) => (
                <ChipButton
                  key={option.id}
                  selected={draftCategory === option.id}
                  onClick={() => setDraftCategory(option.id)}
                >
                  {option.label}
                </ChipButton>
              ))}
            </div>
          </div>

          {/* 기간 필터 */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              기간
            </span>
            <div className="flex flex-wrap gap-2">
              {DATE_RANGE_OPTIONS.map((option) => (
                <ChipButton
                  key={option.id}
                  selected={draftDateRange === option.id}
                  onClick={() => setDraftDateRange(option.id)}
                >
                  {option.label}
                </ChipButton>
              ))}
            </div>
          </div>

          {/* 정렬 */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              정렬
            </span>
            <div className="flex flex-wrap gap-2">
              <ChipButton selected>최신순</ChipButton>
              <ChipButton selected={false} disabled>
                인기순
              </ChipButton>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
