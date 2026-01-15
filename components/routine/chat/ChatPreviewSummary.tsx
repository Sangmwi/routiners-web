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
  onApply: () => void;
  isApplying?: boolean;
}

/**
 * 미리보기 요약 카드
 *
 * 채팅 내에서 루틴/식단 미리보기를 컴팩트하게 표시
 * 상세 보기는 별도 드로어에서 처리
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
    <div className={`my-4 mx-1 rounded-xl border bg-card overflow-hidden ${
      isRoutine ? 'border-primary/30' : 'border-meal/30'
    }`}>
      {/* 헤더 */}
      <div className={`p-4 border-b border-border ${
        isRoutine ? 'bg-primary/5' : 'bg-meal/5'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`w-5 h-5 ${isRoutine ? 'text-primary' : 'text-meal'}`} />
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>{stats.duration}</span>
          <span>·</span>
          <span>{stats.frequency}</span>
          {stats.perSession && (
            <>
              <span>·</span>
              <span>{stats.perSession}</span>
            </>
          )}
        </div>
      </div>

      {/* 주차별 요약 (최대 2줄) */}
      <div className="p-4 space-y-1.5">
        {weekSummaries.slice(0, 2).map((summary, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <span className="text-muted-foreground shrink-0 min-w-[45px]">{idx + 1}주차:</span>
            <span className="text-foreground line-clamp-1">{summary}</span>
          </div>
        ))}
        {weekSummaries.length > 2 && (
          <p className="text-xs text-muted-foreground">
            +{weekSummaries.length - 2}주 더...
          </p>
        )}
      </div>

      {/* 충돌 경고 */}
      {hasConflicts && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>기존 일정과 겹치는 날이 있습니다</span>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className={`p-4 border-t border-border ${
        isRoutine ? 'bg-primary/5' : 'bg-meal/5'
      }`}>
        {!showRevisionInput ? (
          <div className="flex gap-2">
            {/* 상세 보기 */}
            <button
              onClick={onViewDetails}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm border border-border bg-background hover:bg-muted transition-colors"
            >
              <List className="w-4 h-4" />
              상세 보기
            </button>

            {/* 수정 요청 */}
            <button
              onClick={() => setShowRevisionInput(true)}
              disabled={isApplying}
              className="flex items-center justify-center px-3 py-2.5 rounded-lg text-sm border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50"
              aria-label="수정 요청"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* 적용 */}
            <button
              onClick={onApply}
              disabled={isApplying}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
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
              className={`w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 ${
                isRoutine ? 'focus:ring-primary/50' : 'focus:ring-meal/50'
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRevisionInput(false);
                  setRevisionText('');
                }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleRevisionSubmit}
                disabled={!revisionText.trim()}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
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
  );
}
