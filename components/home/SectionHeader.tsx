'use client';

import ViewMoreButton from '@/components/ui/ViewMoreButton';

interface SectionHeaderProps {
  title: string;
  showMoreButton?: boolean;
  onMoreClick?: () => void;
}

export default function SectionHeader({ title, showMoreButton = false, onMoreClick }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-green-800">{title}</h2>
      {showMoreButton && (
        <ViewMoreButton onClick={onMoreClick} className="text-sm">
          더 보기
        </ViewMoreButton>
      )}
    </div>
  );
}

