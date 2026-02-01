'use client';

import { XIcon, ListIcon, CheckIcon, WarningIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import { getEventIcon } from '@/lib/config/eventTheme';

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
  onViewDetails: () => void;
  onCancel: () => void;
  onApply: (forceOverwrite?: boolean) => void;
  isApplying?: boolean;
}

/**
 * 미리보기 요약 카드 - 모던 디자인
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
  onViewDetails,
  onCancel,
  onApply,
  isApplying = false,
}: ChatPreviewSummaryProps) {
  const Icon = getEventIcon(type === 'routine' ? 'workout' : 'meal');

  return (
    <div className="my-4 mx-1">
      <div className="rounded-2xl overflow-hidden bg-linear-to-b from-primary/5 to-transparent">
        {/* 헤더 */}
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-lg leading-tight">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{description}</p>
              {/* 통계 칩 */}
              <div className="flex flex-wrap gap-2 mt-3">
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
            <div className="flex items-center gap-2 text-amber-500">
              <WarningIcon size={16} className="shrink-0" />
              <span className="text-sm font-medium">기존 일정과 겹치는 날이 있습니다</span>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="p-3 bg-primary/5">
          <div className="flex gap-2">
            {/* 취소 */}
            <button
              onClick={onCancel}
              disabled={isApplying}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors disabled:opacity-50"
              aria-label="취소"
            >
              <XIcon size={16} />
            </button>

            {/* 상세 보기 */}
            <button
              onClick={onViewDetails}
              disabled={isApplying}
              className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium bg-muted/40 hover:bg-muted/60 transition-colors disabled:opacity-50"
            >
              <ListIcon size={16} />
              상세 보기
            </button>

            {/* 적용 */}
            <button
              onClick={() => onApply(hasConflicts)}
              disabled={isApplying}
              className={`flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${
                hasConflicts
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
      </div>
    </div>
  );
}
