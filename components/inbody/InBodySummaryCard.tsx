'use client';

import { NextIcon } from '@/components/ui/icons';
import { MetricsGrid, InBodyChanges } from './MetricsGrid';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

// ============================================================
// Types
// ============================================================

interface InBodyLatestData {
  weight: number;
  skeletalMuscleMass: number;
  bodyFatPercentage: number;
  inbodyScore?: number | null;
  measuredAt: string;
}

interface InBodySummaryCardProps {
  /** 최근 측정 데이터 */
  latest: InBodyLatestData | null | undefined;
  /** 총 기록 수 */
  totalRecords?: number;
  /** 이전 측정 대비 변화량 (선택) */
  changes?: InBodyChanges;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 간소화 모드 (프로필 페이지용) */
  compact?: boolean;
  /** 카드 스타일 변형 */
  variant?: 'flat' | 'card';
}

// ============================================================
// Sub Components
// ============================================================

function EmptyState({ onClick }: { onClick?: () => void }) {
  return (
    <div
      className={`bg-surface-secondary rounded-xl p-4 ${
        onClick ? 'cursor-pointer hover:bg-surface-muted transition-colors' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-card-foreground">
            아직 인바디 기록이 없어요
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            탭하여 기록을 추가하세요
          </p>
        </div>
        {onClick && <NextIcon size="md" className="text-muted-foreground" />}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

/**
 * InBody 요약 카드 컴포넌트
 *
 * @description
 * - 최근 측정 데이터를 요약하여 표시
 * - 변화량 표시 지원 (선택)
 * - 프로필 페이지 및 인바디 관리 페이지에서 재사용
 *
 * @example
 * ```tsx
 * <InBodySummaryCard
 *   latest={summary?.latest}
 *   totalRecords={summary?.totalRecords}
 *   onClick={() => router.push('/profile/inbody')}
 * />
 * ```
 */
export default function InBodySummaryCard({
  latest,
  changes,
  onClick,
  compact = false,
  variant = 'flat',
}: InBodySummaryCardProps) {
  if (!latest) {
    return <EmptyState onClick={onClick} />;
  }

  const formattedDate = formatKoreanDate(latest.measuredAt, { monthFormat: 'short' });

  const baseClass = variant === 'card'
    ? 'bg-card rounded-2xl p-5'
    : 'bg-surface-secondary rounded-xl p-4';

  return (
    <div
      className={`${baseClass} ${
        onClick ? 'cursor-pointer hover:bg-surface-muted transition-colors' : ''
      }`}
      onClick={onClick}
    >
      {/* 메트릭 그리드 */}
      <MetricsGrid data={latest} changes={changes} />

      {/* Footer: Date (left) + Score badge (right) */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-edge-faint">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{formattedDate} 측정</span>
          {onClick && <NextIcon size="xs" />}
        </div>
        {latest.inbodyScore && !compact && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-accent text-primary">
            {latest.inbodyScore}점
          </span>
        )}
      </div>
    </div>
  );
}
