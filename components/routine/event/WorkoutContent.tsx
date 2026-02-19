'use client';

import { useRouter } from 'next/navigation';
import EmptyState from '@/components/common/EmptyState';
import {
  ExerciseCard,
  EventStatusBadge,
  EventActionButtons,
} from '@/components/routine';
import { useWorkoutSession } from '@/hooks/routine/useWorkoutSession';
import { useWorkoutEvent } from '@/hooks/routine/useWorkoutEvent';
import { useUpdateWorkoutData } from '@/hooks/routine';
import { useShowError } from '@/lib/stores/errorStore';
import { ActiveWorkout, WorkoutComplete } from '@/components/routine/workout';
import EditableExerciseList from './EditableExerciseList';
import AddExerciseSheet from '@/components/routine/sheets/AddExerciseSheet';
import { CalendarIcon, PencilSimpleIcon, PlusIcon, RobotIcon, TrashIcon } from '@phosphor-icons/react';
import { getEventConfig } from '@/lib/config/theme';
import { formatKoreanDate, getToday } from '@/lib/utils/dateHelpers';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import AddWorkoutSheet from '@/components/routine/sheets/AddWorkoutSheet';
import type { WorkoutExercise, WorkoutSet } from '@/lib/types/routine';

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

  // 데이터 + 뮤테이션 로직
  const {
    event,
    workoutData,
    handleDelete,
    handleComplete,
    handleSkip,
    handleSetsChange,
    isCompleting,
    isSkipping,
  } = useWorkoutEvent(date);

  // 날짜 포맷 & 이벤트 설정
  const formattedDate = formatKoreanDate(date, { weekday: true });
  const eventConfig = getEventConfig('workout');
  const isToday = date === getToday();

  // 직접 추가 바텀시트
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  // 편집 모드
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExercises, setEditingExercises] = useState<WorkoutExercise[]>([]);
  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState(false);
  const updateWorkout = useUpdateWorkoutData();
  const showError = useShowError();

  const enterEditMode = () => {
    if (!workoutData) return;
    setEditingExercises([...workoutData.exercises]);
    setIsEditMode(true);
  };

  const exitEditMode = (save: boolean) => {
    if (save && event && workoutData) {
      const updatedData = { ...workoutData, exercises: editingExercises };
      updateWorkout.mutate(
        { id: event.id, data: updatedData, date: event.date, type: event.type },
        { onError: () => showError('운동 저장에 실패했어요') },
      );
    }
    setIsEditMode(false);
    setEditingExercises([]);
  };

  const handleEditSetsChange = (exerciseId: string, sets: WorkoutSet[]) => {
    setEditingExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, sets } : e)),
    );
  };

  const handleAddExercises = (newExercises: WorkoutExercise[]) => {
    setEditingExercises((prev) => [...prev, ...newExercises]);
  };

  // 워크아웃 세션 훅
  const session = useWorkoutSession({
    exercises: workoutData?.exercises ?? [],
    eventId: event?.id ?? '',
    date,
  });

  // 삭제 핸들러 (ref로 최신 클로저 유지)
  const handleDeleteRef = useRef(handleDelete);
  handleDeleteRef.current = handleDelete;

  // 헤더 타이틀 동적 업데이트
  useEffect(() => {
    if (event?.title && onTitleChange) {
      onTitleChange(event.title);
    }
  }, [event?.title, onTitleChange]);

  // 편집 모드 종료 핸들러 (ref로 최신 클로저 유지)
  const exitEditModeRef = useRef(exitEditMode);
  exitEditModeRef.current = exitEditMode;
  const enterEditModeRef = useRef(enterEditMode);
  enterEditModeRef.current = enterEditMode;

  // 헤더 액션
  useEffect(() => {
    if (!onHeaderAction) return;
    if (!event) {
      onHeaderAction(null);
      return;
    }

    if (isEditMode) {
      // 편집 모드: "완료" 버튼
      onHeaderAction(
        <button
          onClick={() => exitEditModeRef.current(true)}
          className="px-3 py-1 text-sm font-medium text-primary"
        >
          완료
        </button>
      );
    } else if (event.status === 'scheduled') {
      // 일반 모드 (scheduled): 편집 + 삭제
      onHeaderAction(
        <div className="flex items-center gap-1">
          <button
            onClick={() => enterEditModeRef.current()}
            className="p-1 text-muted-foreground"
            aria-label="편집"
          >
            <PencilSimpleIcon size={20} />
          </button>
          <button
            onClick={() => handleDeleteRef.current()}
            className="p-1 text-muted-foreground"
            aria-label="삭제"
          >
            <TrashIcon size={20} />
          </button>
        </div>
      );
    } else {
      // completed/skipped: 삭제만
      onHeaderAction(
        <button
          onClick={() => handleDeleteRef.current()}
          className="p-1 text-muted-foreground"
          aria-label="삭제"
        >
          <TrashIcon size={20} />
        </button>
      );
    }
  }, [event?.id, event?.status, isEditMode, onHeaderAction]);

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
              onClick={() => router.push('/routine/coach')}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-primary text-primary-foreground"
            >
              <RobotIcon size={18} />
              AI 상담에게 맡기기
            </button>
            <button
              onClick={() => setIsAddSheetOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-muted/50 text-muted-foreground"
            >
              <PlusIcon size={18} weight="bold" />
              운동 직접 추가
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
        isLoading={isCompleting}
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
        {isEditMode ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              운동 목록 ({editingExercises.length}개)
            </h2>
            <EditableExerciseList
              exercises={editingExercises}
              onExercisesChange={setEditingExercises}
              onSetsChange={handleEditSetsChange}
            />
            <button
              type="button"
              onClick={() => setIsAddExerciseSheetOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground"
            >
              <PlusIcon size={16} weight="bold" />
              운동 추가
            </button>
          </div>
        ) : workoutData && workoutData.exercises.length > 0 ? (
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

      {/* 하단 액션 버튼 (편집 모드가 아닐 때만) */}
      {!isEditMode && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-safe bg-background border-t border-border">
          <EventActionButtons
            status={event.status}
            mode="start"
            onStart={session.startWorkout}
            onSkip={handleSkip}
            isLoading={isSkipping}
            startDisabled={!isToday}
            hasActiveSession={session.hasActiveSession}
          />
        </div>
      )}

      {/* 편집 모드 운동 추가 시트 */}
      <AddExerciseSheet
        isOpen={isAddExerciseSheetOpen}
        onClose={() => setIsAddExerciseSheetOpen(false)}
        onAdd={handleAddExercises}
        existingNames={new Set(editingExercises.map((e) => e.name))}
      />
    </>
  );
}
