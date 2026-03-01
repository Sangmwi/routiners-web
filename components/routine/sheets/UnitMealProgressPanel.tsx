'use client';

import {
  BuildingsIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  ClockIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { formatKoreanDate, getDayOfWeek } from '@/lib/utils/dateHelpers';

// ============================================================================
// Types (exported so main drawer can share the same type)
// ============================================================================

export type DayImportStatus =
  | 'pending'
  | 'fetching'
  | 'fetched'
  | 'saving'
  | 'saved'
  | 'skipped'
  | 'error';

// ============================================================================
// Sub-components
// ============================================================================

function StatusIcon({ status }: { status: DayImportStatus }) {
  switch (status) {
    case 'pending':
      return <ClockIcon size={18} className="text-hint" />;
    case 'fetching':
    case 'saving':
      return <CircleNotchIcon size={18} weight="bold" className="text-primary animate-spin" />;
    case 'fetched':
      return <CheckCircleIcon size={18} className="text-blue-500" />;
    case 'saved':
      return <CheckCircleIcon size={18} weight="fill" className="text-green-500" />;
    case 'skipped':
      return <WarningCircleIcon size={18} className="text-yellow-500" />;
    case 'error':
      return <WarningCircleIcon size={18} className="text-red-500" />;
  }
}

function StatusLabel({ status }: { status: DayImportStatus }) {
  const labels: Record<DayImportStatus, string> = {
    pending: '대기',
    fetching: '조회중...',
    fetched: '조회 완료',
    saving: '저장중...',
    saved: '완료',
    skipped: '이미 등록됨',
    error: '실패',
  };
  const colors: Record<DayImportStatus, string> = {
    pending: 'text-hint',
    fetching: 'text-primary',
    fetched: 'text-blue-500',
    saving: 'text-primary',
    saved: 'text-green-500',
    skipped: 'text-yellow-500',
    error: 'text-red-500',
  };
  return <span className={`text-xs font-medium ${colors[status]}`}>{labels[status]}</span>;
}

// ============================================================================
// Panel Component
// ============================================================================

interface UnitMealProgressPanelProps {
  unitName: string | undefined;
  startDate: string;
  endDate: string;
  dayStatuses: Map<string, DayImportStatus>;
  progress: number;
  importDone: boolean;
  isImporting: boolean;
  savedCount: number;
  skippedDates: string[];
  failedDates: string[];
}

export default function UnitMealProgressPanel({
  unitName,
  startDate,
  endDate,
  dayStatuses,
  progress,
  importDone,
  isImporting,
  savedCount,
  skippedDates,
  failedDates,
}: UnitMealProgressPanelProps) {
  return (
    <>
      {/* 헤더 */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BuildingsIcon size={18} className="text-muted-foreground" />
          <span className="text-sm font-semibold">{unitName}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatKoreanDate(startDate, { year: false })} ~{' '}
          {formatKoreanDate(endDate, { year: false })}
        </p>
      </div>

      {/* 프로그레스 바 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{importDone ? '완료' : isImporting ? '불러오는 중...' : '준비 중...'}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 날짜별 진행 리스트 */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {Array.from(dayStatuses.entries()).map(([d, status]) => (
          <div key={d} className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <StatusIcon status={status} />
            <span className="text-sm flex-1">
              {formatKoreanDate(d, { year: false, weekday: true, weekdayFormat: 'short' })}
            </span>
            <StatusLabel status={status} />
          </div>
        ))}
      </div>

      {/* 완료 결과 */}
      {importDone && (
        <div className="bg-surface-secondary rounded-xl p-4 space-y-2">
          {savedCount > 0 ? (
            <p className="text-sm font-medium text-green-600">{savedCount}일분 식단이 등록되었어요!</p>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">등록된 식단이 없어요</p>
          )}
          {skippedDates.length > 0 && (
            <p className="text-xs text-yellow-500">
              이미 등록된 날짜 {skippedDates.length}일 건너뜀
            </p>
          )}
          {failedDates.length > 0 && (
            <p className="text-xs text-red-500">
              조회 실패 {failedDates.length}일: {failedDates.map((d) => getDayOfWeek(d)).join(', ')}
            </p>
          )}
        </div>
      )}
    </>
  );
}
