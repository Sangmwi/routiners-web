'use client';

import { ReactNode } from 'react';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

interface BodyCompositionSummaryProps {
  /** 키 (cm) */
  height?: number | null;
  /** 최근 측정일 (ISO string 또는 YYYY-MM-DD) */
  measuredAt?: string | null;
  /** 인바디 점수 */
  score?: number | null;
  /** 이전 측정과의 기간 차이 (일) — 있으면 "N일 전 대비" 표시 */
  periodDays?: number;
  /**
   * 날짜 표시 텍스트 직접 지정 (suffix 없이 그대로 표시)
   * 미지정 시 measuredAt으로 "M월 D일 측정" 자동 포맷
   * @example dateText={formatTimeAgo(measuredAt)} // "23시간 전"
   */
  dateText?: string;
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
  score,
  periodDays,
  dateText,
  children,
}: BodyCompositionSummaryProps) {
  const hasHeader = score != null || !!height || !!measuredAt || !!dateText;

  // dateText 직접 지정 시 그대로 표시, 아니면 measuredAt으로 "M월 D일 측정" 자동 포맷
  const displayDate = dateText
    ?? (measuredAt ? `${formatKoreanDate(measuredAt, { year: false })} 측정` : null);

  return (
    <div>
      {hasHeader && (
        <>
          <div className="flex items-center justify-between mb-3">
            {/* 좌측: 키 + 점수 뱃지 */}
            <div className="flex items-center gap-2">
              {height && (
                <p className="text-xs text-muted-foreground">
                  키 <span className="font-medium text-foreground">{height}cm</span>
                </p>
              )}
              {score != null && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-accent text-primary">
                  {score}점
                </span>
              )}
            </div>
            {/* 우측: 날짜 · 기간 */}
            <div className="flex items-center gap-2">
              {displayDate && (
                <p className="text-xs text-muted-foreground">
                  {displayDate}
                </p>
              )}
              {periodDays != null && periodDays > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-secondary text-hint-strong">
                  {periodDays}일 전 대비
                </span>
              )}
            </div>
          </div>
          <div className="border-t border-edge-faint mb-3" />
        </>
      )}
      {children}
    </div>
  );
}
