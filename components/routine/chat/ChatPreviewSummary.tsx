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
 * 미리보기 요약 카드 - 모던 디자인
 *
 * Phase 9: status prop 추가
 * - pending: 버튼 활성화
 * - applied: "✓ 적용됨" 배지 표시
 * - cancelled: "취소됨" 배지 표시 (흐리게)
 *
 * 수정 요청은 채팅 입력창을 통해 자연스럽게 가능
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
      {/* 상태 배지 */}
      {status !== 'pending' && (
        <div className="px-5 pt-3">
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
            status === 'applied'
              ? 'bg-green-500/10 text-green-600'
              : 'bg-muted text-muted-foreground'
          }`}>
            {status === 'applied' ? (
              <>
                <CheckIcon size={12} weight="bold" />
                적용됨
              </>
            ) : (
              <>
                <ProhibitIcon size={12} />
                취소됨
              </>
            )}
          </span>
        </div>
      )}

      {/* 헤더 */}
      <div className={`p-5 ${status !== 'pending' ? 'pt-2' : ''} pb-4`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg leading-tight">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{description}</p>
            {/* 통계 칩 + 상세보기 */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex flex-wrap gap-2">
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
          </div>
        </div>
      </div>

      {/* 주차별 요약 */}
      <div className="px-5 pb-5 space-y-2">
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
      {hasConflicts && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-warning">
            <WarningIcon size={14} className="shrink-0" />
            <span className="text-xs font-medium">기존 일정과 겹치는 날이 있습니다</span>
          </div>
        </div>
      )}

      {/* 액션 버튼 - pending 상태에서만 표시 */}
      {status === 'pending' && (
        <div className="p-3 bg-primary/5">
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
        </div>
      )}
    </div>
  );
}
