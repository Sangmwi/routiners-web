'use client';

import { useState } from 'react';
import { Dumbbell, Utensils, List, Edit2, Check, AlertTriangle, Loader2 } from 'lucide-react';

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
  onRevision: (feedback: string) => void;
  onApply: (forceOverwrite?: boolean) => void;
  isApplying?: boolean;
}

/**
 * 미리보기 요약 카드 - 모던 디자인
 */
export default function ChatPreviewSummary({
  type,
  title,
  description,
  stats,
  weekSummaries,
  hasConflicts = false,
  onViewDetails,
  onRevision,
  onApply,
  isApplying = false,
}: ChatPreviewSummaryProps) {
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionText, setRevisionText] = useState('');

  const Icon = type === 'routine' ? Dumbbell : Utensils;
  const isRoutine = type === 'routine';

  const handleRevisionSubmit = () => {
    if (revisionText.trim()) {
      onRevision(revisionText.trim());
      setRevisionText('');
      setShowRevisionInput(false);
    }
  };

  return (
    <div className="my-4 mx-1">
      <div className={`rounded-2xl border overflow-hidden ${
        isRoutine ? 'border-primary/20 bg-linear-to-b from-primary/5 to-transparent' : 'border-meal/20 bg-linear-to-b from-meal/5 to-transparent'
      }`}>
        {/* 헤더 */}
        <div className="p-4 pb-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isRoutine 
                ? 'bg-linear-to-br from-primary to-primary/70' 
                : 'bg-linear-to-br from-meal to-meal/70'
            }`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground leading-tight">{title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
            </div>
          </div>

          {/* 통계 - 인라인 텍스트 */}
          <p className="text-xs text-muted-foreground mt-3">
            {stats.duration} · {stats.frequency}
            {stats.perSession && (
              <span className={isRoutine ? 'text-primary' : 'text-meal'}> · {stats.perSession}</span>
            )}
          </p>
        </div>

        {/* 주차별 요약 */}
        <div className="px-4 pb-3 space-y-1.5">
          {weekSummaries.slice(0, 2).map((summary, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <span className={`shrink-0 font-semibold ${
                isRoutine ? 'text-primary' : 'text-meal'
              }`}>
                {idx + 1}주차:
              </span>
              <span className="text-muted-foreground line-clamp-1">{summary}</span>
            </div>
          ))}
          {weekSummaries.length > 2 && (
            <p className="text-xs text-muted-foreground/60">
              +{weekSummaries.length - 2}주 더...
            </p>
          )}
        </div>

        {/* 충돌 경고 */}
        {hasConflicts && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">기존 일정과 겹치는 날이 있습니다</span>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className={`p-3 ${isRoutine ? 'bg-primary/5' : 'bg-meal/5'}`}>
          {!showRevisionInput ? (
            <div className="flex gap-2">
              {/* 상세 보기 */}
              <button
                onClick={onViewDetails}
                className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <List className="w-4 h-4" />
                상세 보기
              </button>

              {/* 수정 요청 */}
              <button
                onClick={() => setShowRevisionInput(true)}
                disabled={isApplying}
                className="flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors disabled:opacity-50"
                aria-label="수정 요청"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* 적용 */}
              <button
                onClick={() => onApply(hasConflicts)}
                disabled={isApplying}
                className={`flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${
                  hasConflicts
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : isRoutine
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-meal text-meal-foreground hover:opacity-90'
                }`}
              >
                {isApplying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    적용
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
                placeholder={isRoutine
                  ? "수정하고 싶은 내용을 알려주세요... (예: 하체 운동을 더 추가해줘)"
                  : "수정하고 싶은 내용을 알려주세요... (예: 단백질을 더 추가해줘)"
                }
                rows={2}
                className={`w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 ${
                  isRoutine ? 'focus:ring-primary/50' : 'focus:ring-meal/50'
                }`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRevisionInput(false);
                    setRevisionText('');
                  }}
                  className="flex-1 h-11 rounded-xl text-sm font-medium border border-border bg-card text-foreground hover:bg-muted/50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleRevisionSubmit}
                  disabled={!revisionText.trim()}
                  className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${
                    isRoutine
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-meal text-meal-foreground hover:opacity-90'
                  }`}
                >
                  수정 요청
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
