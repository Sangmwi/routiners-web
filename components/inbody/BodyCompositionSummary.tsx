'use client';

import { ReactNode } from 'react';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

interface BodyCompositionSummaryProps {
  /** 키 (cm) */
  height?: number | null;
  /** 최근 측정일 (ISO string 또는 YYYY-MM-DD) */
  measuredAt?: string | null;
  /** 메트릭 그리드 + 추가 콘텐츠 (MetricItem, 스파크라인 등) */
  children: ReactNode;
}

/**
 * 체성분 요약 레이아웃
 *
 * 키·날짜 헤더 → 구분선 → 하위 콘텐츠(메트릭 그리드 등)를 감싸는 재사용 컴포넌트.
 * 프로필 정보탭, 홈 인바디 섹션 등에서 공통 사용.
 */
export default function BodyCompositionSummary({
  height,
  measuredAt,
  children,
}: BodyCompositionSummaryProps) {
  const hasHeader = !!height || !!measuredAt;

  const dateLabel = measuredAt
    ? formatKoreanDate(measuredAt, { year: false })
    : null;

  return (
    <div>
      {hasHeader && (
        <>
          <div className="flex items-center justify-between mb-3">
            {height ? (
              <p className="text-xs text-muted-foreground">
                키 <span className="font-medium text-foreground">{height}cm</span>
              </p>
            ) : (
              <span />
            )}
            {dateLabel && (
              <p className="text-xs text-muted-foreground">
                {dateLabel} 측정
              </p>
            )}
          </div>
          <div className="border-t border-border/30 mb-3" />
        </>
      )}
      {children}
    </div>
  );
}
