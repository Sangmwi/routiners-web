'use client';

import { BarbellIcon } from '@phosphor-icons/react';
import EmptyState from '@/components/common/EmptyState';
import ChangeIndicator from '@/components/ui/ChangeIndicator';
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
}

export default function Big3RecordList({ records, onRecordClick }: Big3RecordListProps) {
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

  // 변화량 계산용: 같은 종목의 직전 기록
  const prevWeightByLift = new Map<string, number>();
  const sortedRecords = [...records].sort(
    (a, b) => a.recordedAt.localeCompare(b.recordedAt),
  );
  const changeMap = new Map<string, number>();
  for (const record of sortedRecords) {
    const prev = prevWeightByLift.get(record.liftType);
    if (prev !== undefined) {
      changeMap.set(record.id, record.weight - prev);
    }
    prevWeightByLift.set(record.liftType, record.weight);
  }

  return (
    <div>
      {[...grouped.entries()].map(([date, dateRecords]) => (
        <div key={date}>
          <div className="px-(--layout-padding-x) py-2.5 bg-surface-muted">
            <span className="text-xs font-medium text-muted-foreground">
              {formatDate(date)}
            </span>
          </div>
          {dateRecords.map((record) => (
            <button
              key={record.id}
              onClick={() => onRecordClick(record)}
              className="w-full flex items-center justify-between px-(--layout-padding-x) py-3.5 border-b border-edge-faint active:bg-surface-muted transition-colors"
            >
              <div className="flex items-center gap-3">
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
                {changeMap.has(record.id) && (
                  <ChangeIndicator value={changeMap.get(record.id)!} positiveIsGood unit="kg" />
                )}
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
