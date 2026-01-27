'use client';

import { useState } from 'react';
import { ClockIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import { getEventIcon } from '@/lib/config/eventTheme';
import Modal from '@/components/ui/Modal';
import type { RoutinePreviewData, RoutinePreviewDay, RoutinePreviewExercise } from '@/lib/types/fitness';

const DAY_NAMES = ['', '월', '화', '수', '목', '금', '토', '일'];

interface PreviewDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preview: RoutinePreviewData;
  onApply: (forceOverwrite?: boolean) => void;
  isApplying?: boolean;
}

/**
 * 루틴 상세 보기 드로어
 *
 * 미니멀하고 구조적인 디자인
 * - 카드 기반 레이아웃
 * - 하단 버튼 고정
 * - 명확한 시각적 계층
 */
export default function PreviewDetailDrawer({
  isOpen,
  onClose,
  preview,
  onApply,
  isApplying = false,
}: PreviewDetailDrawerProps) {
  const [selectedWeek, setSelectedWeek] = useState(1);

  // Null guard - preview가 없으면 렌더링하지 않음
  if (!preview?.weeks) {
    return null;
  }

  const weeks = preview.weeks;
  const currentWeek = weeks.find(w => w.weekNumber === selectedWeek);
  const hasConflicts = (preview.conflicts?.length ?? 0) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      height="full"
      showCloseButton={false}
    >
      {/* 헤더 */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-start gap-3">
          {(() => {
            const Icon = getEventIcon('workout');
            return (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            );
          })()}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground text-lg leading-tight">
              {preview.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {preview.description}
            </p>
          </div>
        </div>
      </div>

      {/* 주차 탭 */}
      <div className="flex px-5 gap-2 pb-3 overflow-x-auto scrollbar-hide">
        {weeks.map((week) => (
          <button
            key={week.weekNumber}
            onClick={() => setSelectedWeek(week.weekNumber)}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all shrink-0 ${
              selectedWeek === week.weekNumber
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {week.weekNumber}주차
          </button>
        ))}
      </div>

      {/* 일별 상세 (스크롤 영역) */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-6 space-y-4">
          {currentWeek?.days.map((day, idx) => (
            <RoutineDayCard key={idx} day={day} />
          ))}
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="sticky bottom-0 p-4 bg-card">
        <button
          onClick={() => onApply(hasConflicts)}
          disabled={isApplying}
          className={`w-full py-3.5 rounded-xl font-medium transition-all disabled:opacity-50 active:scale-[0.98] ${
            hasConflicts
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isApplying ? (
            <span className="flex items-center justify-center gap-2">
              <SpinnerGapIcon size={16} className="animate-spin" />
              적용 중...
            </span>
          ) : (
            '이 루틴 적용하기'
          )}
        </button>
      </div>
    </Modal>
  );
}

// =============================================================================
// Day Cards
// =============================================================================

/**
 * 루틴 일별 카드 - 미니멀 디자인
 */
function RoutineDayCard({ day }: { day: RoutinePreviewDay }) {
  return (
    <div className="bg-muted/20 rounded-2xl overflow-hidden">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-primary/10">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
            {DAY_NAMES[day.dayOfWeek]}
          </span>
          <span className="text-sm font-medium text-foreground truncate">{day.title}</span>
        </div>
        {day.estimatedDuration && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
            <ClockIcon size={16} />
            <span>{day.estimatedDuration}분</span>
          </div>
        )}
      </div>

      {/* 운동 목록 */}
      <div className="px-4 py-4 space-y-4">
        {day.exercises.map((exercise, idx) => (
          <ExerciseItem
            key={idx}
            exercise={exercise}
            isLast={idx === day.exercises.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 운동 항목
 */
function ExerciseItem({
  exercise,
  isLast,
}: {
  exercise: RoutinePreviewExercise;
  isLast: boolean;
}) {
  return (
    <div className={`pb-4 ${!isLast ? 'border-b border-border/20' : ''}`}>
      <p className="text-sm font-medium text-foreground">{exercise.name}</p>
      <p className="text-sm text-muted-foreground mt-1.5">
        {exercise.sets}세트 · {exercise.reps}회
        {exercise.rest && (
          <span className="text-primary"> · 휴식 {exercise.rest}</span>
        )}
      </p>
    </div>
  );
}

