'use client';

import { useState } from 'react';
import { TimerIcon, RobotIcon } from '@phosphor-icons/react';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import HeaderShell, { HeaderBackButton } from '@/components/layouts/shared/HeaderShell';
import ActiveExerciseView from './ActiveExerciseView';
import ExerciseNav from './ExerciseNav';
import WorkoutAIDrawer from './WorkoutAIDrawer';
import { formatElapsedTime } from '@/lib/utils/dateHelpers';
import type { WorkoutSessionReturn } from '@/hooks/routine/useWorkoutSession';

interface ActiveWorkoutProps {
  session: WorkoutSessionReturn;
}

/**
 * 운동 진행 메인 화면 (full-screen overlay)
 *
 * - 자체 PageHeader (뒤로가기 = 중단 확인)
 * - 프로그레스 바
 * - ActiveExerciseView (현재 운동)
 * - ExerciseNav (하단 고정)
 */
export default function ActiveWorkout({ session }: ActiveWorkoutProps) {
  const confirm = useConfirmDialog();
  const [isAISheetOpen, setIsAISheetOpen] = useState(false);

  const {
    state,
    currentExercise,
    nextSetIndex,
    isCurrentExerciseCompleted,
    isAllExercisesCompleted,
    progress,
    elapsedSeconds,
    completeSet,
    undoSet,
    updateSetValue,
    goToNextExercise,
    goToPrevExercise,
    completeWorkout,
    exitWorkout,
    skipRest,
  } = session;

  const isLastExercise =
    state.currentExerciseIndex === state.exercises.length - 1;

  const handleBack = () => {
    confirm({
      title: '운동을 중단하시겠어요?',
      message: '진행 내용은 저장됩니다.',
      confirmText: '중단하기',
      cancelText: '계속하기',
      onConfirm: () => exitWorkout(),
    });
  };

  if (!currentExercise) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* 헤더 */}
      <HeaderShell
        below={
          <div className="h-1 bg-surface-secondary">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        }
      >
        <div className="flex items-center gap-3">
          <HeaderBackButton onClick={handleBack} />
          <h1 className="text-lg font-bold text-foreground">
            {currentExercise.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
            <TimerIcon size={14} weight="bold" />
            {formatElapsedTime(elapsedSeconds)}
          </span>
          <span className="text-sm font-medium text-muted-foreground tabular-nums">
            {state.currentExerciseIndex + 1}/{state.exercises.length}
          </span>
        </div>
      </HeaderShell>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-(--layout-padding-x) pb-72">
        <ActiveExerciseView
          exercise={currentExercise}
          exerciseIndex={state.currentExerciseIndex}
          nextSetIndex={nextSetIndex}
          onCompleteSet={(setIndex) =>
            completeSet(state.currentExerciseIndex, setIndex)
          }
          onUndoSet={(setIndex) =>
            undoSet(state.currentExerciseIndex, setIndex)
          }
          onUpdateSetValue={(setIndex, field, value) =>
            updateSetValue(state.currentExerciseIndex, setIndex, field, value)
          }
        />
      </div>

      {/* AI 트레이너 플로팅 버튼 */}
      <button
        onClick={() => setIsAISheetOpen(true)}
        className={`fixed right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-all duration-300 ${state.restTimer.active ? 'bottom-56' : 'bottom-36'}`}
        aria-label="AI 트레이너"
      >
        <RobotIcon size={22} weight="fill" />
      </button>

      {/* AI 트레이너 드로어 */}
      <WorkoutAIDrawer
        isOpen={isAISheetOpen}
        onClose={() => setIsAISheetOpen(false)}
        exerciseName={currentExercise.name}
      />

      {/* 하단 네비게이션 */}
      <ExerciseNav
        currentIndex={state.currentExerciseIndex}
        totalExercises={state.exercises.length}
        isCurrentExerciseCompleted={isCurrentExerciseCompleted}
        isLastExercise={isLastExercise}
        isAllExercisesCompleted={isAllExercisesCompleted}
        nextSetIndex={nextSetIndex}
        onPrev={goToPrevExercise}
        onNext={goToNextExercise}
        onCompleteWorkout={completeWorkout}
        onCompleteSet={() => {
          if (nextSetIndex >= 0) {
            completeSet(state.currentExerciseIndex, nextSetIndex);
          }
        }}
        restTimer={state.restTimer}
        onSkipRest={skipRest}
      />
    </div>
  );
}
