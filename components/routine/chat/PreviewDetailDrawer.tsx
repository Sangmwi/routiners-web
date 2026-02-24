'use client';

import { useState } from 'react';
import { CheckIcon, ClockIcon, ProhibitIcon, ArrowsClockwiseIcon, PlusCircleIcon } from '@phosphor-icons/react';
import ChipButton from '@/components/ui/ChipButton';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import Modal from '@/components/ui/Modal';
import type { RoutinePreviewData, RoutinePreviewDay, RoutinePreviewExercise } from '@/lib/types/fitness';
import type { RoutinePreviewStatus } from '@/lib/types/chat';

const DAY_NAMES = ['', '월', '화', '수', '목', '금', '토', '일'];

type ApplyMode = 'replace' | 'append';

interface PreviewDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preview: RoutinePreviewData;
  /** 메시지 상태 (Phase 10) */
  status?: RoutinePreviewStatus;
  /** Phase 11: weekCount, appendMode 추가 */
  onApply: (forceOverwrite?: boolean, weekCount?: number, appendMode?: boolean) => void;
  isApplying?: boolean;
  /** 기존 예정된 루틴 존재 여부 (대체/이어붙이기 선택 표시용) */
  hasExistingScheduled?: boolean;
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
  hasExistingScheduled = false,
}: PreviewDetailDrawerProps) {
  const [selectedWeekCount, setSelectedWeekCount] = useState(
    preview.daysPerWeek <= 2 ? 1 : 2
  ); // 빠른 루틴(1~2일) → 1주 기본, 본격 루틴(3일+) → 2주 기본
  const [applyMode, setApplyMode] = useState<ApplyMode>('replace'); // 대체 or 이어붙이기

  // Null guard - preview가 없으면 렌더링하지 않음
  if (!preview?.weeks) {
    return null;
  }

  const weeks = preview.weeks;
  const firstWeek = weeks[0]; // 첫 주만 표시 (동일 루틴)
  const hasConflicts = (preview.conflicts?.length ?? 0) > 0;
  const isActionable = status === 'pending' && !isApplying;

  // 선택한 주차까지의 총 일수 계산 (1주 데이터 × 선택 주차)
  const daysPerWeek = firstWeek.days.length;
  const totalDays = selectedWeekCount * daysPerWeek;

  // 주차 선택 옵션 (항상 1~4주)
  const weekOptions = Array.from({ length: 4 }, (_, i) => ({
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
      stickyFooter={
        <GradientFooter variant="sheet" className="space-y-3">
          {status === 'pending' ? (
            <>
              {/* 주차 선택 */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  {weekOptions.map((opt) => (
                    <ChipButton
                      key={opt.value}
                      selected={selectedWeekCount === opt.value}
                      onClick={() => setSelectedWeekCount(opt.value)}
                    >
                      {opt.label}
                    </ChipButton>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  총 {totalDays}일
                </span>
              </div>

              {/* 대체/이어붙이기 선택 (기존 스케줄이 있을 때만) */}
              {hasExistingScheduled && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setApplyMode('replace')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                      applyMode === 'replace'
                        ? 'bg-surface-accent text-primary ring-1 ring-accent'
                        : 'bg-surface-muted text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <ArrowsClockwiseIcon size={14} weight={applyMode === 'replace' ? 'bold' : 'regular'} />
                    기존 루틴 대체
                  </button>
                  <button
                    onClick={() => setApplyMode('append')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                      applyMode === 'append'
                        ? 'bg-surface-accent text-primary ring-1 ring-accent'
                        : 'bg-surface-muted text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <PlusCircleIcon size={14} weight={applyMode === 'append' ? 'bold' : 'regular'} />
                    기존 루틴 이후에 추가
                  </button>
                </div>
              )}

              {/* 적용 버튼 */}
              <Button
                variant="primary"
                fullWidth
                onClick={() => onApply(
                  hasConflicts && applyMode === 'replace',
                  selectedWeekCount,
                  applyMode === 'append'
                )}
                disabled={!isActionable}
                isLoading={isApplying}
                className={`shadow-none hover:shadow-none ${
                  hasConflicts && applyMode === 'replace'
                    ? 'bg-warning text-warning-foreground hover:bg-warning/90'
                    : ''
                }`}
              >
                {isApplying
                  ? '적용 중...'
                  : `${selectedWeekCount}주 루틴 ${applyMode === 'append' ? '이어붙이기' : '적용하기'}`}
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center py-3.5">
              <span className={`text-sm font-medium flex items-center gap-1.5 ${
                status === 'applied' ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                {status === 'applied' ? (
                  <>
                    <CheckIcon size={16} weight="bold" />
                    이미 적용된 루틴이에요
                  </>
                ) : (
                  <>
                    <ProhibitIcon size={16} />
                    취소된 루틴이에요
                  </>
                )}
              </span>
            </div>
          )}
        </GradientFooter>
      }
    >
      {/* 헤더 - 배지 + 타이틀 + 설명 */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 text-xs font-medium bg-surface-muted text-muted-foreground rounded-full">
            주 {preview.daysPerWeek}회
          </span>
          {firstWeek?.days[0]?.estimatedDuration && (
            <span className="px-2.5 py-1 text-xs font-medium bg-surface-accent text-primary rounded-full">
              {firstWeek.days[0].estimatedDuration}분
            </span>
          )}
        </div>
        <h2 className="font-semibold text-foreground text-lg leading-tight">
          {preview.title}
        </h2>
        {preview.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {preview.description}
          </p>
        )}
      </div>

      {/* 일별 상세 - 첫 주만 표시 */}
      <div className="px-5 pb-6 space-y-4">
        {firstWeek?.days.map((day, idx) => (
          <RoutineDayCard key={idx} day={day} />
        ))}
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
    <div className="bg-surface-secondary rounded-2xl overflow-hidden">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-accent">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="w-7 h-7 rounded-full bg-surface-accent-strong text-primary text-xs font-semibold flex items-center justify-center shrink-0">
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
    <div className={`pb-4 ${!isLast ? 'border-b border-edge-divider' : ''}`}>
      <p className="text-sm font-medium text-foreground">{exercise.name}</p>
      <p className="text-sm text-muted-foreground mt-1.5">
        {exercise.sets}세트 · {exercise.reps}회
        {exercise.weight != null && exercise.weight > 0 && (
          <span className="text-foreground font-medium"> · {exercise.weight}kg</span>
        )}
        {exercise.rest && (
          <span className="text-primary"> · 휴식 {exercise.rest}</span>
        )}
      </p>
    </div>
  );
}
