'use client';

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
        <button
          onClick={onMoreClick}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          더보기
        </button>
      )}
    </div>
  );
}

