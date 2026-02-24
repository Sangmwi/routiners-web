'use client';

import { CalendarIcon } from '@phosphor-icons/react';
import { NextIcon, LoadingSpinner } from '@/components/ui/icons';
import { InBodyRecord } from '@/lib/types/inbody';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

// ============================================================
// Types
// ============================================================

interface InBodyRecordListProps {
  records: InBodyRecord[];
  isLoading?: boolean;
  onRecordClick?: (record: InBodyRecord) => void;
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

function EmptyState({
  message,
  description,
}: {
  message: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CalendarIcon size={48} className="text-muted-foreground mb-4" />
      <p className="text-lg font-medium text-card-foreground">{message}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
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
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-accent text-primary">
              {record.inbodyScore}점
            </span>
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
  emptyMessage = '아직 인바디 기록이 없어요',
  emptyDescription = '인바디 결과지를 스캔해서 기록을 추가해보세요',
}: InBodyRecordListProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (records.length === 0) {
    return <EmptyState message={emptyMessage} description={emptyDescription} />;
  }

  return (
    <div className="divide-y divide-edge-divider">
      {records.map((record) => (
        <RecordItem
          key={record.id}
          record={record}
          onClick={onRecordClick}
        />
      ))}
    </div>
  );
}
