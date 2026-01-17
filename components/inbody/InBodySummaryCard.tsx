'use client';

import { NextIcon } from '@/components/ui/icons';
import { MetricsGrid, InBodyChanges } from './MetricsGrid';

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
}

// ============================================================
// Sub Components
// ============================================================

function EmptyState({ onClick }: { onClick?: () => void }) {
  return (
    <div
      className={`bg-muted/30 rounded-xl p-4 ${
        onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-card-foreground">
            아직 등록된 기록이 없어요
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            탭하여 인바디 기록을 추가하세요
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
  totalRecords = 0,
  changes,
  onClick,
  compact = false,
}: InBodySummaryCardProps) {
  if (!latest) {
    return <EmptyState onClick={onClick} />;
  }

  const formattedDate = new Date(latest.measuredAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={`bg-muted/30 rounded-xl p-4 ${
        onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''
      }`}
      onClick={onClick}
    >
      {/* 메트릭 그리드 */}
      <MetricsGrid data={latest} changes={changes} />

      {/* 점수 뱃지 (있는 경우) */}
      {latest.inbodyScore && !compact && (
        <div className="flex justify-center mt-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
            인바디 점수 {latest.inbodyScore}점
          </span>
        </div>
      )}

      {/* 하단 정보 */}
      <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
        {compact ? (
          <>
            <span>{formattedDate} 측정</span>
            {onClick && <NextIcon size="xs" />}
          </>
        ) : (
          <>
            <span>총 {totalRecords}개의 기록</span>
            {onClick && <NextIcon size="xs" />}
          </>
        )}
      </div>
    </div>
  );
}
