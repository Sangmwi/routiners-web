'use client';

import { useState } from 'react';
import { CaretDownIcon, CaretRightIcon, CalendarIcon, ClockIcon, CheckIcon, PencilSimpleIcon, WarningIcon } from '@phosphor-icons/react';
import type { RoutinePreviewData, RoutinePreviewWeek, RoutinePreviewDay } from '@/lib/types/fitness';
import { getEventIcon } from '@/lib/config/eventTheme';

interface ChatRoutinePreviewProps {
  /** 루틴 미리보기 데이터 */
  preview: RoutinePreviewData;
  /** 적용 버튼 클릭 (forceOverwrite: true면 기존 루틴 덮어쓰기) */
  onApply: (forceOverwrite?: boolean) => void;
  /** 수정 요청 */
  onRequestRevision: (feedback: string) => void;
  /** 로딩 상태 */
  isApplying?: boolean;
}

const DAY_NAMES = ['', '월', '화', '수', '목', '금', '토', '일'];

/**
 * 운동 일자 카드
 */
function DayCard({ day }: { day: RoutinePreviewDay }) {
  return (
    <div className="pl-4 py-2 border-l-2 border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-foreground">
          {DAY_NAMES[day.dayOfWeek]}요일
        </span>
        <span className="text-sm text-muted-foreground">- {day.title}</span>
        {day.estimatedDuration && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ClockIcon size={12} />
            {day.estimatedDuration}분
          </span>
        )}
      </div>
      <div className="space-y-1">
        {day.exercises.map((exercise, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-sm text-muted-foreground"
          >
            <span>{exercise.name}</span>
            <span className="text-xs">
              {exercise.sets}x{exercise.reps}
              {exercise.rest && (
                <span className="text-muted-foreground/60 ml-1">({exercise.rest})</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 주차 카드 (접기/펼치기)
 */
function WeekCard({ week, defaultOpen = false }: { week: RoutinePreviewWeek; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-muted/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
      >
        <span className="text-sm font-medium">
          {week.weekNumber}주차
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{week.days.length}일</span>
          {isOpen ? (
            <CaretDownIcon size={16} />
          ) : (
            <CaretRightIcon size={16} />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="p-3 space-y-3 bg-background">
          {week.days.map((day, idx) => (
            <DayCard key={idx} day={day} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 루틴 미리보기 컴포넌트
 *
 * AI가 생성한 루틴을 미리보기로 표시
 * 사용자가 확인 후 적용하거나 수정 요청 가능
 */
export default function ChatRoutinePreview({
  preview,
  onApply,
  onRequestRevision,
  isApplying = false,
}: ChatRoutinePreviewProps) {
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionText, setRevisionText] = useState('');

  const hasConflicts = preview.conflicts && preview.conflicts.length > 0;

  const handleRevisionSubmit = () => {
    if (revisionText.trim()) {
      onRequestRevision(revisionText.trim());
      setRevisionText('');
      setShowRevisionInput(false);
    }
  };

  return (
    <div className="rounded-xl bg-card overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 bg-muted/20">
        <div className="flex items-center gap-2 mb-1">
          {(() => {
            const Icon = getEventIcon('workout');
            return <Icon className="w-5 h-5 text-primary" />;
          })()}
          <h3 className="font-semibold text-foreground">{preview.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{preview.description}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarIcon size={12} />
            {preview.durationWeeks}주
          </span>
          <span>주 {preview.daysPerWeek}회</span>
        </div>
      </div>

      {/* 충돌 경고 */}
      {hasConflicts && (
        <div className="p-3 bg-scheduled/10 border-b border-scheduled/20">
          <div className="flex items-start gap-2">
            <WarningIcon size={16} className="text-scheduled mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-warning">
                기존 루틴 {preview.conflicts!.length}개와 겹칩니다
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                적용하면 해당 날짜의 기존 운동이 새 루틴으로 대체됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 주차별 목록 */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {preview.weeks.map((week, idx) => (
          <WeekCard key={week.weekNumber} week={week} defaultOpen={idx === 0} />
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="p-4 bg-muted/10">
        {!showRevisionInput ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowRevisionInput(true)}
              disabled={isApplying}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <PencilSimpleIcon size={16} />
              수정 요청
            </button>
            <button
              onClick={() => onApply(hasConflicts)}
              disabled={isApplying}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                hasConflicts
                  ? 'bg-scheduled text-scheduled-foreground hover:opacity-90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isApplying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  적용 중...
                </>
              ) : hasConflicts ? (
                <>
                  <WarningIcon size={16} />
                  덮어쓰고 적용
                </>
              ) : (
                <>
                  <CheckIcon size={16} />
                  이 루틴 적용
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
                placeholder="수정하고 싶은 내용을 알려주세요... (예: 하체 운동을 더 추가해줘)"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
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
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
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
