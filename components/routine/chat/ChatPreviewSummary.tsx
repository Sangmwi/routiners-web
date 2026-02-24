'use client';

import { CheckIcon, WarningIcon, ProhibitIcon, PencilSimpleIcon, ArrowRightIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import ViewMoreButton from '@/components/ui/ViewMoreButton';
import type { RoutinePreviewStatus } from '@/lib/types/chat';

interface PreviewStats {
  duration: string;      // "4주"
  frequency: string;     // "주 4회" or "하루 3끼"
  perSession?: string;   // "45분" or "2,400kcal"
}

interface ChatPreviewSummaryProps {
  type: 'routine' | 'meal';
  title: string;
  description: string;
  stats: PreviewStats;
  weekSummaries: string[]; // ["상체A, 하체A, 상체B, 하체B", ...]
  hasConflicts?: boolean;
  /** 메시지 상태 (Phase 9) */
  status?: RoutinePreviewStatus;
  onViewDetails: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onApply: (forceOverwrite?: boolean) => void;
  isApplying?: boolean;
}

/**
 * 미리보기 요약 카드
 *
 * Phase 19: 칩 + CTA 디자인
 * - pending: [종료] [수정] (outline 칩) + [적용 →] (solid CTA)
 * - applied/edited/cancelled: 상태 표시
 */
export default function ChatPreviewSummary({
  type,
  title,
  description,
  stats,
  weekSummaries,
  hasConflicts = false,
  status = 'pending',
  onViewDetails,
  onCancel,
  onEdit,
  isApplying = false,
}: ChatPreviewSummaryProps) {
  const isActionable = status === 'pending' && !isApplying;

  // 상태별 표시
  const statusDisplay: Record<Exclude<RoutinePreviewStatus, 'pending'>, { icon: ReactNode; text: string; className: string }> = {
    applied: {
      icon: <CheckIcon size={14} weight="bold" />,
      text: type === 'meal' ? '식단이 적용되었어요' : '루틴이 적용되었어요',
      className: 'text-green-600',
    },
    edited: {
      icon: <PencilSimpleIcon size={14} />,
      text: '수정 요청됨',
      className: 'text-warning',
    },
    cancelled: {
      icon: <ProhibitIcon size={14} />,
      text: '종료됨',
      className: 'text-muted-foreground',
    },
  };

  return (
    <div className={`rounded-2xl overflow-hidden ${status !== 'pending' ? 'opacity-60' : ''}`}>
      {/* 헤더: 배지들 + 자세히 */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-medium bg-surface-hover text-muted-foreground rounded-full">
              {stats.duration}
            </span>
            <span className="px-2.5 py-1 text-xs font-medium bg-surface-hover text-muted-foreground rounded-full">
              {stats.frequency}
            </span>
            {stats.perSession && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-surface-accent text-primary">
                {stats.perSession}
              </span>
            )}
          </div>
          <ViewMoreButton onClick={onViewDetails} variant="muted">
            자세히
          </ViewMoreButton>
        </div>

        {/* 타이틀 */}
        <h3 className="font-semibold text-foreground text-lg leading-tight mt-4">
          {title}
        </h3>

        {/* 디스크립션 */}
        {description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* 주차별 요약 */}
      <div className="px-5 pb-4 space-y-2">
        {weekSummaries.slice(0, 2).map((summary, idx) => (
          <div key={idx} className="flex items-start gap-3 py-3 px-4 bg-surface-secondary rounded-xl">
            <span className="shrink-0 text-xs font-semibold text-primary">
              {idx + 1}주차
            </span>
            <span className="text-xs text-foreground/80 line-clamp-1">{summary}</span>
          </div>
        ))}
        {weekSummaries.length > 2 && (
          <p className="text-xs text-hint-strong pl-4">
            +{weekSummaries.length - 2}주 더...
          </p>
        )}
      </div>

      {/* 충돌 경고 */}
      {hasConflicts && status === 'pending' && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-warning/10 text-warning">
            <WarningIcon size={14} className="shrink-0" />
            <span className="text-xs font-medium">기존 일정과 겹치는 날이 있어요</span>
          </div>
        </div>
      )}

      {/* 액션 영역 */}
      <div className="px-5 pb-5">
        {status === 'pending' ? (
          <div className="flex items-center gap-2">
            {/* 종료 - Outline 칩 */}
            <button
              onClick={onCancel}
              disabled={!isActionable}
              className="h-11 px-5 rounded-full text-sm font-medium
                         border border-edge-subtle text-muted-foreground
                         hover:bg-surface-secondary hover:border-border
                         transition-all active:scale-[0.97] disabled:opacity-50"
            >
              종료
            </button>

            {/* 수정 - Outline 칩 */}
            <button
              onClick={onEdit}
              disabled={!isActionable}
              className="h-11 px-5 rounded-full text-sm font-medium
                         border border-edge-subtle text-muted-foreground
                         hover:bg-surface-secondary hover:border-border
                         transition-all active:scale-[0.97] disabled:opacity-50"
            >
              수정
            </button>

            {/* 자세히 보기 - Solid CTA (나머지 공간) → DetailDrawer에서 주차 선택 후 적용 */}
            <button
              onClick={onViewDetails}
              disabled={!isActionable}
              className="flex-1 h-11 rounded-full text-sm font-semibold
                         shadow-sm transition-all active:scale-[0.98] disabled:opacity-50
                         flex items-center justify-center gap-2
                         bg-primary text-primary-foreground hover:bg-primary/90"
            >
              자세히 보기
              <ArrowRightIcon size={16} weight="bold" />
            </button>
          </div>
        ) : (
          /* 상태 표시 */
          <div className="flex items-center justify-center h-11 rounded-full bg-surface-secondary">
            <span className={`text-sm font-medium flex items-center gap-1.5 ${statusDisplay[status as Exclude<RoutinePreviewStatus, 'pending'>].className}`}>
              {statusDisplay[status as Exclude<RoutinePreviewStatus, 'pending'>].icon}
              {statusDisplay[status as Exclude<RoutinePreviewStatus, 'pending'>].text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
