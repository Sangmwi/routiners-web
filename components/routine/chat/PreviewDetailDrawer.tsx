'use client';

import { useState } from 'react';
import { CheckIcon, ClockIcon, ProhibitIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import Modal from '@/components/ui/Modal';
import type { RoutinePreviewData, RoutinePreviewDay, RoutinePreviewExercise } from '@/lib/types/fitness';
import type { RoutinePreviewStatus } from '@/lib/types/chat';

const DAY_NAMES = ['', '월', '화', '수', '목', '금', '토', '일'];

interface PreviewDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preview: RoutinePreviewData;
  /** 메시지 상태 (Phase 10) */
  status?: RoutinePreviewStatus;
  /** Phase 11: weekCount 추가 */
  onApply: (forceOverwrite?: boolean, weekCount?: number) => void;
  isApplying?: boolean;
}

/**
 * 루틴 상세 보기 드로어
 *
 * Phase 11.5: UX 개선
 * - 아이콘 제거, 배지 + 타이틀 + 설명 구조
 * - 설명 전체 표시 (line-clamp 제거)
 * - 주차 탭 제거 (동일 루틴이므로 첫 주만 표시)
 * - 주차 선택 UI 하단 고정
 */
export default function PreviewDetailDrawer({
  isOpen,
  onClose,
  preview,
  status = 'pending',
  onApply,
  isApplying = false,
}: PreviewDetailDrawerProps) {
  const [selectedWeekCount, setSelectedWeekCount] = useState(2); // 적용할 주차 수

  // Null guard - preview가 없으면 렌더링하지 않음
  if (!preview?.weeks) {
    return null;
  }

  const weeks = preview.weeks;
  const firstWeek = weeks[0]; // 첫 주만 표시 (동일 루틴)
  const hasConflicts = (preview.conflicts?.length ?? 0) > 0;
  const isActionable = status === 'pending' && !isApplying;

  // 선택한 주차까지의 총 일수 계산
  const totalDays = weeks
    .slice(0, selectedWeekCount)
    .reduce((sum, w) => sum + w.days.length, 0);

  // 주차 선택 옵션 (최대 4주)
  const weekOptions = Array.from({ length: Math.min(weeks.length, 4) }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}주`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      height="full"
      showCloseButton={false}
    >
      {/* 헤더 - 배지 + 타이틀 + 설명 */}
      <div className="px-5 pt-2 pb-4">
        {/* 배지들 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 text-xs font-medium bg-muted/50 text-muted-foreground rounded-full">
            주 {preview.daysPerWeek}회
          </span>
          {firstWeek?.days[0]?.estimatedDuration && (
            <span className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {firstWeek.days[0].estimatedDuration}분
            </span>
          )}
        </div>

        {/* 타이틀 */}
        <h2 className="font-semibold text-foreground text-lg leading-tight">
          {preview.title}
        </h2>

        {/* 설명 - 전체 표시 */}
        {preview.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {preview.description}
          </p>
        )}
      </div>

      {/* 일별 상세 (스크롤 영역) - 첫 주만 표시 */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-6 space-y-4">
          {firstWeek?.days.map((day, idx) => (
            <RoutineDayCard key={idx} day={day} />
          ))}
        </div>
      </div>

      {/* 하단 고정: 주차 선택 + 버튼 */}
      <div className="sticky bottom-0 p-4 bg-card space-y-3">
        {status === 'pending' ? (
          <>
            {/* 주차 선택 */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {weekOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedWeekCount(opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all shrink-0 ${
                      selectedWeekCount === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                총 {totalDays}일
              </span>
            </div>

            {/* 적용 버튼 */}
            <button
              onClick={() => onApply(hasConflicts, selectedWeekCount)}
              disabled={!isActionable}
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
                `${selectedWeekCount}주 루틴 적용하기`
              )}
            </button>
          </>
        ) : (
          /* 상태 표시 (중앙 정렬) */
          <div className="flex items-center justify-center py-3.5">
            <span className={`text-sm font-medium flex items-center gap-1.5 ${
              status === 'applied' ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              {status === 'applied' ? (
                <>
                  <CheckIcon size={16} weight="bold" />
                  이미 적용된 루틴입니다
                </>
              ) : (
                <>
                  <ProhibitIcon size={16} />
                  취소된 루틴입니다
                </>
              )}
            </span>
          </div>
        )}
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
