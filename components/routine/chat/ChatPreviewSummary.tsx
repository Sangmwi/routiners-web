'use client';

import { XIcon, CheckIcon, WarningIcon, SpinnerGapIcon, ProhibitIcon } from '@phosphor-icons/react';
import { getEventIcon } from '@/lib/config/eventTheme';
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
  onApply: (forceOverwrite?: boolean) => void;
  isApplying?: boolean;
}

/**
 * 미리보기 요약 카드 - Phase 10 디자인
 *
 * 레이아웃:
 * - Row 1: 아이콘 + 배지들(end정렬) + 자세히 버튼
 * - Row 2: 타이틀
 * - Row 3: 디스크립션
 * - 주차별 요약
 * - 액션 버튼 OR 상태 표시 (중앙 정렬)
 *
 * Phase 10: status에 따라 버튼 자리에 상태 텍스트 표시
 * - pending: 취소/적용 버튼
 * - applied: "루틴이 적용되었습니다" 중앙 정렬
 * - cancelled: "취소되었습니다" 중앙 정렬
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
  onApply,
  isApplying = false,
}: ChatPreviewSummaryProps) {
  const Icon = getEventIcon(type === 'routine' ? 'workout' : 'meal');
  const isActionable = status === 'pending' && !isApplying;

  return (
    <div className={`rounded-2xl overflow-hidden bg-linear-to-b from-primary/5 to-transparent ${
      status !== 'pending' ? 'opacity-75' : ''
    }`}>
      {/* 헤더 Row 1: 아이콘 + 배지들 + 자세히 */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          {/* 배지들 + 자세히 버튼 (우측 정렬) */}
          <div className="flex-1 flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-medium bg-muted/50 text-muted-foreground rounded-full">
              {stats.duration}
            </span>
            <span className="px-2.5 py-1 text-xs font-medium bg-muted/50 text-muted-foreground rounded-full">
              {stats.frequency}
            </span>
            {stats.perSession && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {stats.perSession}
              </span>
            )}
          </div>
          <ViewMoreButton onClick={onViewDetails} variant="muted">
            자세히
          </ViewMoreButton>
        </div>

        {/* Row 2: 타이틀 */}
        <h3 className="font-semibold text-foreground text-lg leading-tight mt-5">
          {title}
        </h3>

        {/* Row 3: 디스크립션, 줄간격 넓게*/}
        {description && (
          <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* 주차별 요약 */}
      <div className="px-5 pb-4 space-y-2">
        {weekSummaries.slice(0, 2).map((summary, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
            <span className="shrink-0 text-xs font-semibold text-primary">
              {idx + 1}주차
            </span>
            <span className="text-xs text-foreground/80 line-clamp-1">{summary}</span>
          </div>
        ))}
        {weekSummaries.length > 2 && (
          <p className="text-xs text-muted-foreground/60 pl-3">
            +{weekSummaries.length - 2}주 더...
          </p>
        )}
      </div>

      {/* 충돌 경고 */}
      {hasConflicts && status === 'pending' && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-warning">
            <WarningIcon size={14} className="shrink-0" />
            <span className="text-xs font-medium">기존 일정과 겹치는 날이 있습니다</span>
          </div>
        </div>
      )}

      {/* 액션 영역: 버튼 OR 상태 표시 */}
      <div className="p-3 bg-primary/5">
        {status === 'pending' ? (
          /* 액션 버튼 */
          <div className="flex gap-2">
            {/* 취소 */}
            <button
              onClick={onCancel}
              disabled={!isActionable}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium
                         bg-muted/40 hover:bg-muted/60 transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              <XIcon size={16} />
              취소
            </button>

            {/* 적용 */}
            <button
              onClick={() => onApply(hasConflicts)}
              disabled={!isActionable}
              className={`flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${hasConflicts
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
            >
              {isApplying ? (
                <SpinnerGapIcon size={16} className="animate-spin" />
              ) : (
                <>
                  <CheckIcon size={16} />
                  적용
                </>
              )}
            </button>
          </div>
        ) : (
          /* 상태 표시 (중앙 정렬) */
          <div className="flex items-center justify-center h-11">
            <span className={`text-xs font-medium flex items-center gap-1.5 ${
              status === 'applied' ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              {status === 'applied' ? (
                <>
                  <CheckIcon size={14} weight="bold" />
                  루틴이 적용되었습니다
                </>
              ) : (
                <>
                  <ProhibitIcon size={14} />
                  취소되었습니다
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
