'use client';

import { useRef, useEffect } from 'react';
import { NextIcon, LoadingSpinner } from '@/components/ui/icons';
import SharedEmptyState from '@/components/common/EmptyState';
import Tag from '@/components/ui/Tag';
import { EMPTY_STATE } from '@/lib/config/theme';
import { InBodyRecord } from '@/lib/types/inbody';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

// ============================================================
// Types
// ============================================================

interface InBodyRecordListProps {
  records: InBodyRecord[];
  isLoading?: boolean;
  onRecordClick?: (record: InBodyRecord) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  emptyDescription?: string;
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

function EmptyState({ message, description }: { message: string; description: string }) {
  return <SharedEmptyState {...EMPTY_STATE.inbody.noRecord} message={message} hint={description} size="lg" />;
}

function RecordItem({
  record,
  onClick,
}: {
  record: InBodyRecord;
  onClick?: (record: InBodyRecord) => void;
}) {
  const formattedDate = formatKoreanDate(record.measuredAt);

  return (
    <div
      className="flex items-center justify-between px-(--layout-padding-x) py-3.5 hover:bg-surface-secondary active:bg-surface-secondary transition-colors cursor-pointer"
      onClick={() => onClick?.(record)}
    >
      <div className="flex-1 min-w-0">
        {/* Row 1: Date + Score badge inline */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">{formattedDate}</p>
          {record.inbodyScore && (
            <Tag colorScheme="primary" size="sm">{record.inbodyScore}점</Tag>
          )}
        </div>
        {/* Row 2: Metrics with emphasized values */}
        <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
          <span>체중 <span className="font-semibold text-card-foreground">{record.weight}</span>kg</span>
          <span className="text-border">·</span>
          <span>골격근 <span className="font-semibold text-card-foreground">{record.skeletalMuscleMass}</span>kg</span>
          <span className="text-border">·</span>
          <span>체지방률 <span className="font-semibold text-card-foreground">{record.bodyFatPercentage}</span>%</span>
        </div>
      </div>
      <NextIcon size="md" className="text-muted-foreground flex-shrink-0 ml-3" />
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

/**
 * InBody 기록 리스트 컴포넌트
 *
 * @description
 * - 인바디 기록 목록 표시
 * - 로딩/빈 상태 처리
 * - 개별 기록 클릭 시 상세 모달 연결
 */
export default function InBodyRecordList({
  records,
  isLoading = false,
  onRecordClick,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  emptyMessage = '아직 인바디 기록이 없어요',
  emptyDescription = '인바디 결과지를 스캔해서 기록을 추가해보세요',
}: InBodyRecordListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onLoadMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (records.length === 0) {
    return <EmptyState message={emptyMessage} description={emptyDescription} />;
  }

  return (
    <div>
      <div className="divide-y divide-edge-divider">
        {records.map((record) => (
          <RecordItem
            key={record.id}
            record={record}
            onClick={onRecordClick}
          />
        ))}
      </div>

      {/* 무한스크롤 sentinel */}
      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isFetchingNextPage && <LoadingSpinner size="md" />}
        </div>
      )}
    </div>
  );
}
