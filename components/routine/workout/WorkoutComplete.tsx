'use client';

import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import {
  TrophyIcon,
  TimerIcon,
  BarbellIcon,
  ChartBarIcon,
  CheckCircleIcon,
  SkipForwardIcon,
} from '@phosphor-icons/react';
import { formatElapsedTime } from '@/lib/utils/dateHelpers';
import type { WorkoutSessionReturn } from '@/hooks/routine/useWorkoutSession';

interface WorkoutCompleteProps {
  session: WorkoutSessionReturn;
  onDone: () => void;
  isLoading?: boolean;
}

/**
 * 운동 완료 요약 화면
 */
export default function WorkoutComplete({
  session,
  onDone,
  isLoading = false,
}: WorkoutCompleteProps) {
  const { state, totalSetsCompleted, totalSets, elapsedSeconds } = session;
  const { exercises } = state;

  // 소요 시간 (분 단위 + 포맷)
  const elapsedMinutes = Math.round(elapsedSeconds / 60);

  // 운동별 요약
  const exerciseSummaries = exercises.map((ex) => {
    const completedCount = ex.sets.filter((s) => s.completed).length;
    const isCompleted = completedCount === ex.sets.length;
    return {
      name: ex.name,
      completedSets: completedCount,
      totalSets: ex.sets.length,
      isCompleted,
    };
  });

  const completedExerciseCount = exerciseSummaries.filter(
    (s) => s.isCompleted
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-(--layout-padding-x) pt-16 pb-footer-clearance">
          {/* 축하 아이콘 */}
          <div className="w-20 h-20 rounded-full bg-surface-accent flex items-center justify-center mb-4">
            <TrophyIcon size={40} weight="fill" className="text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">
            운동 완료!
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            오늘도 수고했어요
          </p>

          {/* 통계 카드 */}
          <div className="w-full rounded-2xl bg-surface-secondary p-5 space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-accent flex items-center justify-center">
                <TimerIcon size={20} weight="fill" className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">소요 시간</p>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {formatElapsedTime(elapsedSeconds)}
                  <span className="text-sm font-normal text-muted-foreground ml-1.5">
                    ({elapsedMinutes > 0 ? `${elapsedMinutes}분` : '1분 미만'})
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-accent flex items-center justify-center">
                <BarbellIcon size={20} weight="fill" className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">운동 수</p>
                <p className="text-lg font-bold text-foreground">
                  {completedExerciseCount}/{exercises.length}개
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-accent flex items-center justify-center">
                <ChartBarIcon size={20} weight="fill" className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">세트 완료</p>
                <p className="text-lg font-bold text-foreground">
                  {totalSetsCompleted}/{totalSets}
                </p>
              </div>
            </div>
          </div>

          {/* 운동별 요약 */}
          <div className="w-full space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              운동별 요약
            </h3>
            {exerciseSummaries.map((summary) => (
              <div
                key={summary.name}
                className="flex items-center gap-3 rounded-xl bg-surface-secondary px-4 py-3"
              >
                {summary.isCompleted ? (
                  <CheckCircleIcon
                    size={20}
                    weight="fill"
                    className="text-primary"
                  />
                ) : (
                  <SkipForwardIcon
                    size={20}
                    weight="bold"
                    className="text-muted-foreground"
                  />
                )}
                <span className="flex-1 text-sm font-medium text-foreground">
                  {summary.name}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {summary.completedSets}/{summary.totalSets}세트
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 완료 버튼 */}
      <GradientFooter variant="page">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={onDone}
          isLoading={isLoading}
        >
          완료하기
        </Button>
      </GradientFooter>
    </div>
  );
}
