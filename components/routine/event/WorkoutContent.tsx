'use client';

import { useRouter } from 'next/navigation';
import EmptyState from '@/components/common/EmptyState';
import { useShowError } from '@/lib/stores/errorStore';
import {
  ExerciseCard,
  EventStatusBadge,
  EventActionButtons,
} from '@/components/routine';
import {
  useRoutineEventByDateSuspense,
  useCompleteRoutineEvent,
  useSkipRoutineEvent,
  useUpdateWorkoutData,
  useDeleteRoutineEvent,
} from '@/hooks/routine';
import { useWorkoutSession, clearPersistedTimer } from '@/hooks/routine/useWorkoutSession';
import { ActiveWorkout, WorkoutComplete } from '@/components/routine/workout';
import type { WorkoutSet, WorkoutData } from '@/lib/types/routine';
import { CalendarIcon, PlusIcon, RobotIcon, TrashIcon } from '@phosphor-icons/react';
import { getEventConfig } from '@/lib/config/theme';
import { formatKoreanDate, getToday } from '@/lib/utils/dateHelpers';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import AddWorkoutSheet from '@/components/routine/sheets/AddWorkoutSheet';

// ============================================================
// Type Guard
// ============================================================

function isWorkoutData(data: unknown): data is WorkoutData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'exercises' in data &&
    Array.isArray((data as WorkoutData).exercises)
  );
}

// ============================================================
// Content Component (Suspense 내부)
// ============================================================

interface WorkoutContentProps {
  date: string;
  onTitleChange?: (title: string) => void;
  onHeaderAction?: (action: ReactNode) => void;
}

/**
 * 운동 상세 콘텐츠 (Suspense 내부)
 *
 * Phase 기반 렌더링:
 * - overview: 운동 목록 + 시작하기/건너뛰기 버튼
 * - active: ActiveWorkout (full-screen overlay)
 * - complete: WorkoutComplete (full-screen overlay)
 */
export default function WorkoutContent({ date, onTitleChange, onHeaderAction }: WorkoutContentProps) {
  const router = useRouter();
  const showError = useShowError();
  const confirm = useConfirmDialog();

  // Suspense 버전 - { data } 구조분해 (null 가능)
  const { data: event } = useRoutineEventByDateSuspense(date, 'workout');

  // 뮤테이션
  const completeEvent = useCompleteRoutineEvent();
  const skipEvent = useSkipRoutineEvent();
  const updateWorkout = useUpdateWorkoutData();
  const deleteEvent = useDeleteRoutineEvent();

  // 날짜 포맷 & 이벤트 설정
  const formattedDate = formatKoreanDate(date, { weekday: true });
  const eventConfig = getEventConfig('workout');
  const isToday = date === getToday();

  // 직접 추가 바텀시트
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  // 운동 데이터 추출
  const workoutData =
    event && isWorkoutData(event.data) ? event.data : null;

  // 워크아웃 세션 훅
  const session = useWorkoutSession({
    exercises: workoutData?.exercises ?? [],
    eventId: event?.id ?? '',
  });

  // 삭제 핸들러 (ref로 최신 클로저 유지)
  const handleDeleteRef = useRef(() => {});
  handleDeleteRef.current = () => {
    if (!event) return;
    confirm({
      title: '루틴을 삭제하시겠어요?',
      message: '삭제하면 되돌릴 수 없어요.',
      confirmText: '삭제',
      onConfirm: async () => {
        await deleteEvent.mutateAsync(event.id);
        router.back();
      },
    });
  };

  // 헤더 타이틀 동적 업데이트
  useEffect(() => {
    if (event?.title && onTitleChange) {
      onTitleChange(event.title);
    }
  }, [event?.title, onTitleChange]);

  // 헤더 삭제 아이콘
  useEffect(() => {
    if (!onHeaderAction) return;
    if (event) {
      onHeaderAction(
        <button
          onClick={() => handleDeleteRef.current()}
          className="p-1 text-muted-foreground"
          aria-label="삭제"
        >
          <TrashIcon size={20} />
        </button>
      );
    } else {
      onHeaderAction(null);
    }
  }, [event?.id, onHeaderAction]);

  // 완료 처리
  const handleComplete = () => {
    if (!event) return;
    completeEvent.mutate(event.id, {
      onSuccess: () => {
        clearPersistedTimer();
        router.back();
      },
      onError: () => showError('운동 완료에 실패했어요'),
    });
  };

  // 건너뛰기 처리
  const handleSkip = () => {
    if (!event) return;
    skipEvent.mutate(event.id, {
      onError: () => showError('운동 스킵에 실패했어요'),
    });
  };

  // 세트 변경 처리 (overview 모드에서 ExerciseCard 편집용)
  const handleSetsChange = (exerciseId: string, sets: WorkoutSet[]) => {
    if (!event || !workoutData) return;

    const updatedExercises = workoutData.exercises.map((ex) =>
      ex.id === exerciseId ? { ...ex, sets } : ex
    );

    updateWorkout.mutate(
      { id: event.id, data: { ...workoutData, exercises: updatedExercises } },
      { onError: () => showError('운동 기록 저장에 실패했어요') }
    );
  };

  // 이벤트 없음 (예정된 운동 없음)
  if (!event) {
    return (
      <>
        <div className="mt-8">
          <EmptyState
            icon={CalendarIcon}
            message={`${formattedDate}에 예정된 운동이 없어요`}
            showIconBackground
            size="lg"
          />
          <div className="flex flex-col gap-3 mt-6 px-4">
            <button
              onClick={() => setIsAddSheetOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-primary text-primary-foreground"
            >
              <PlusIcon size={18} weight="bold" />
              운동 직접 추가
            </button>
            <button
              onClick={() => router.push('/routine/coach')}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-muted/50 text-muted-foreground"
            >
              <RobotIcon size={18} />
              AI 코치에게 맡기기
            </button>
          </div>
        </div>
        <AddWorkoutSheet
          isOpen={isAddSheetOpen}
          onClose={() => setIsAddSheetOpen(false)}
          date={date}
        />
      </>
    );
  }

  // ── Phase: Active ──
  if (session.state.phase === 'active') {
    return <ActiveWorkout session={session} />;
  }

  // ── Phase: Complete ──
  if (session.state.phase === 'complete') {
    return (
      <WorkoutComplete
        session={session}
        onDone={handleComplete}
        isLoading={completeEvent.isPending}
      />
    );
  }

  // ── Phase: Overview (기존 UI) ──
  return (
    <>
      <div className="space-y-8">
        {/* 헤더 섹션 */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <eventConfig.icon size={18} className={eventConfig.color} weight="fill" />
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
            <EventStatusBadge status={event.status} />
          </div>

          {event.rationale && (
            <p className="text-sm text-muted-foreground mt-2">
              {event.rationale}
            </p>
          )}
        </div>

        {/* 운동 목록 */}
        {workoutData && workoutData.exercises.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              운동 목록 ({workoutData.exercises.length}개)
            </h2>
            <div className="space-y-3">
              {workoutData.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  isCompleted={event.status === 'completed'}
                  editable={event.status === 'scheduled'}
                  onSetsChange={handleSetsChange}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-xl p-6 text-center">
            <p className="text-muted-foreground">
              상세 운동 정보가 없어요.
            </p>
          </div>
        )}

        {/* 추가 정보 */}
        {workoutData?.notes && (
          <div className="bg-muted/20 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              메모
            </h3>
            <p className="text-foreground">{workoutData.notes}</p>
          </div>
        )}
      </div>

      {/* 하단 액션 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-safe bg-background border-t border-border">
        <EventActionButtons
          status={event.status}
          mode="start"
          onStart={session.startWorkout}
          onSkip={handleSkip}
          isLoading={skipEvent.isPending}
          startDisabled={!isToday}
          hasActiveSession={session.hasActiveSession}
        />
      </div>
    </>
  );
}
