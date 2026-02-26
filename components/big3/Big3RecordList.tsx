'use client';

import { useRef, useEffect } from 'react';
import { BarbellIcon } from '@phosphor-icons/react';
import EmptyState from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/ui/icons';
import { BIG3_LIFT_CONFIG } from '@/lib/constants/big3';
import type { Big3Record } from '@/lib/types/big3';

const LIFT_LABEL_MAP = Object.fromEntries(
  BIG3_LIFT_CONFIG.map(({ key, label }) => [key, label]),
) as Record<string, string>;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}.${m}.${d}`;
}

interface Big3RecordListProps {
  records: Big3Record[];
  onRecordClick: (record: Big3Record) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export default function Big3RecordList({
  records,
  onRecordClick,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: Big3RecordListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

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

  if (records.length === 0) {
    return (
      <div className="px-(--layout-padding-x) py-12">
        <EmptyState
          icon={BarbellIcon}
          message="기록이 없어요"
          hint="아래 버튼으로 직접 추가하거나, 운동 완료 시 자동으로 기록돼요"
        />
      </div>
    );
  }

  // 날짜별 그룹핑
  const grouped = new Map<string, Big3Record[]>();
  for (const record of records) {
    const existing = grouped.get(record.recordedAt);
    if (existing) {
      existing.push(record);
    } else {
      grouped.set(record.recordedAt, [record]);
    }
  }

  return (
    <div>
      {[...grouped.entries()].map(([date, dateRecords]) => (
        <div key={date}>
          <p className="text-[10px] text-hint-strong px-(--layout-padding-x) pt-4 pb-1.5">
            {formatDate(date)}
          </p>
          <div className="divide-y divide-edge-divider">
            {dateRecords.map((record) => (
              <button
                key={record.id}
                onClick={() => onRecordClick(record)}
                className="w-full flex items-center justify-between px-(--layout-padding-x) py-3.5 active:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {LIFT_LABEL_MAP[record.liftType] ?? record.liftType}
                  </span>
                  {record.source === 'auto' && (
                    <span className="text-[10px] text-hint bg-surface-muted px-1.5 py-0.5 rounded">
                      자동
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {record.weight}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">kg</span>
                  </span>
                  {record.reps && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      ×{record.reps}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* 무한스크롤 sentinel */}
      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isFetchingNextPage && <LoadingSpinner size="md" />}
        </div>
      )}
    </div>
  );
}
