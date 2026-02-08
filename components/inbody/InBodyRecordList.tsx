'use client';

import { memo } from 'react';
import { CalendarIcon } from '@phosphor-icons/react';
import { NextIcon, LoadingSpinner, DeleteIcon } from '@/components/ui/icons';
import { InBodyRecord } from '@/lib/types/inbody';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

// ============================================================
// Types
// ============================================================

interface InBodyRecordListProps {
  records: InBodyRecord[];
  isLoading?: boolean;
  onRecordClick?: (record: InBodyRecord) => void;
  onDeleteClick?: (record: InBodyRecord) => void;
  emptyMessage?: string;
  emptyDescription?: string;
  showDeleteButton?: boolean;
}

interface RecordItemProps {
  record: InBodyRecord;
  onClick?: (record: InBodyRecord) => void;
  onDeleteClick?: (record: InBodyRecord) => void;
  showDeleteButton?: boolean;
}

// ============================================================
// Sub Components
// ============================================================

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="xl" />
    </div>
  );
}

interface EmptyStateProps {
  message: string;
  description: string;
}

function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <CalendarIcon size={48} className="text-muted-foreground mb-4" />
      <p className="text-lg font-medium text-card-foreground">{message}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

const RecordItem = memo(function RecordItem({
  record,
  onClick,
  onDeleteClick,
  showDeleteButton = true,
}: RecordItemProps) {
  const formattedDate = formatKoreanDate(record.measuredAt);

  const handleClick = () => {
    onClick?.(record);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick?.(record);
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-4 hover:bg-muted/20 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-card-foreground">{formattedDate}</p>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span>체중 {record.weight}kg</span>
          <span>-</span>
          <span>골격근 {record.skeletalMuscleMass}kg</span>
          <span>-</span>
          <span>체지방률 {record.bodyFatPercentage}%</span>
        </div>
        {record.inbodyScore && (
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              점수 {record.inbodyScore}점
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {showDeleteButton && onDeleteClick && (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            aria-label="삭제"
          >
            <DeleteIcon size="sm" />
          </button>
        )}
        <NextIcon size="md" className="text-muted-foreground" />
      </div>
    </div>
  );
});

// ============================================================
// Main Component
// ============================================================

/**
 * InBody 기록 목록 컴포넌트
 *
 * @description
 * - 기록 목록을 표시하며 클릭/삭제 액션 지원
 * - 로딩 및 빈 상태 UI 포함
 * - 재사용 가능한 독립 컴포넌트
 *
 * @example
 * ```tsx
 * <InBodyRecordList
 *   records={records}
 *   isLoading={isLoading}
 *   onRecordClick={handleRecordClick}
 *   onDeleteClick={handleDeleteClick}
 * />
 * ```
 */
export default function InBodyRecordList({
  records,
  isLoading = false,
  onRecordClick,
  onDeleteClick,
  emptyMessage = '아직 인바디 기록이 없어요',
  emptyDescription = '인바디 결과지를 스캔해서 기록을 추가해보세요',
  showDeleteButton = true,
}: InBodyRecordListProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (records.length === 0) {
    return <EmptyState message={emptyMessage} description={emptyDescription} />;
  }

  return (
    <div className="divide-y divide-border">
      {records.map((record) => (
        <RecordItem
          key={record.id}
          record={record}
          onClick={onRecordClick}
          onDeleteClick={onDeleteClick}
          showDeleteButton={showDeleteButton}
        />
      ))}
    </div>
  );
}
