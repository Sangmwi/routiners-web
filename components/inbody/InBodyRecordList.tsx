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
      className="flex items-center justify-between px-4 py-4 hover:bg-muted/20 transition-colors cursor-pointer"
      onClick={() => onClick?.(record)}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-card-foreground">{formattedDate}</p>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span>체중 {record.weight}kg</span>
          <span className="text-border">·</span>
          <span>골격근 {record.skeletalMuscleMass}kg</span>
          <span className="text-border">·</span>
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
      <NextIcon size="md" className="text-muted-foreground flex-shrink-0" />
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
    <div className="divide-y divide-border">
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
