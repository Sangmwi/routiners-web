'use client';

import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import {
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  FlagCheckeredIcon,
} from '@phosphor-icons/react';
import RestTimer from './RestTimer';

interface ExerciseNavProps {
  currentIndex: number;
  totalExercises: number;
  isCurrentExerciseCompleted: boolean;
  isLastExercise: boolean;
  isAllExercisesCompleted: boolean;
  nextSetIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onCompleteWorkout: () => void;
  onCompleteSet: () => void;
  restTimer: { active: boolean; remaining: number; total: number };
  onSkipRest: () => void;
}

/**
 * 하단 고정 운동 네비게이션 + 액션 영역
 *
 * 상태 분기:
 * 1. 휴식 중 → RestTimer
 * 2. 세트 남음 → "세트 완료" 버튼
 * 3. 현재 운동 완료 + 다음 있음 → "다음 운동으로"
 * 4. 모든 운동 완료 → "운동 완료하기"
 */
export default function ExerciseNav({
  currentIndex,
  totalExercises,
  isCurrentExerciseCompleted,
  isLastExercise,
  isAllExercisesCompleted,
  nextSetIndex,
  onPrev,
  onNext,
  onCompleteWorkout,
  onCompleteSet,
  restTimer,
  onSkipRest,
}: ExerciseNavProps) {
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalExercises - 1;

  return (
    <GradientFooter variant="page" className="space-y-3">
        {/* 메인 액션 영역 */}
        {restTimer.active ? (
          <RestTimer
            remaining={restTimer.remaining}
            total={restTimer.total}
            onSkip={onSkipRest}
          />
        ) : isAllExercisesCompleted ? (
          <Button
            variant="primary"
            fullWidth
            onClick={onCompleteWorkout}
            size="lg"
          >
            <FlagCheckeredIcon size={18} weight="fill" />
            운동 완료하기
          </Button>
        ) : isCurrentExerciseCompleted && !isLastExercise ? (
          <Button
            variant="primary"
            fullWidth
            onClick={onNext}
            size="lg"
          >
            다음 운동으로
            <CaretRightIcon size={18} weight="bold" />
          </Button>
        ) : isCurrentExerciseCompleted && isLastExercise ? (
          <Button
            variant="primary"
            fullWidth
            onClick={onCompleteWorkout}
            size="lg"
          >
            <FlagCheckeredIcon size={18} weight="fill" />
            운동 완료하기
          </Button>
        ) : nextSetIndex >= 0 ? (
          <Button
            variant="primary"
            fullWidth
            onClick={onCompleteSet}
            size="lg"
          >
            <CheckIcon size={18} weight="bold" />
            {nextSetIndex + 1}세트 완료
          </Button>
        ) : null}

        {/* 이전/다음 네비게이션 */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors"
          >
            <CaretLeftIcon size={16} weight="bold" />
            이전
          </button>

          <span className="text-xs text-muted-foreground tabular-nums">
            {currentIndex + 1} / {totalExercises}
          </span>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors"
          >
            다음
            <CaretRightIcon size={16} weight="bold" />
          </button>
        </div>
    </GradientFooter>
  );
}
