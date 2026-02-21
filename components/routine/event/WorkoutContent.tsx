'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { CalendarIcon, PlusIcon, RobotIcon } from '@phosphor-icons/react';
import EmptyState from '@/components/common/EmptyState';
import {
  EventActionButtons,
  EventStatusBadge,
  ExerciseCard,
} from '@/components/routine';
import AddExerciseSheet from '@/components/routine/sheets/AddExerciseSheet';
import AddWorkoutSheet from '@/components/routine/sheets/AddWorkoutSheet';
import { ActiveWorkout, WorkoutComplete } from '@/components/routine/workout';
import EditableExerciseList from '@/components/routine/event/EditableExerciseList';
import { getEventConfig } from '@/lib/config/theme';
import { useShowError } from '@/lib/stores/errorStore';
import { formatKoreanDate, getToday } from '@/lib/utils/dateHelpers';
import { useEventHeaderActions } from '@/hooks/routine/useEventHeaderActions';
import { useWorkoutEvent } from '@/hooks/routine/useWorkoutEvent';
import { useWorkoutSession } from '@/hooks/routine/useWorkoutSession';
import { useUpdateRoutineEvent, useUpdateWorkoutData } from '@/hooks/routine';
import type { WorkoutExercise, WorkoutSet } from '@/lib/types/routine';

interface WorkoutContentProps {
  date: string;
  onTitleChange?: (title: string) => void;
  onHeaderAction?: (action: ReactNode) => void;
}

export default function WorkoutContent({
  date,
  onTitleChange,
  onHeaderAction,
}: WorkoutContentProps) {
  const router = useRouter();
  const showError = useShowError();

  const {
    event,
    workoutData,
    handleDelete,
    handleComplete,
    handleUncomplete,
    handleSetsChange,
    isCompleting,
    isUncompleting,
  } = useWorkoutEvent(date);

  const formattedDate = formatKoreanDate(date, { weekday: true });
  const eventConfig = getEventConfig('workout');
  const isToday = date === getToday();

  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExercises, setEditingExercises] = useState<WorkoutExercise[]>([]);
  const [editingTitle, setEditingTitle] = useState('');
  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState(false);

  const updateWorkout = useUpdateWorkoutData();
  const updateEvent = useUpdateRoutineEvent();

  const enterEditMode = useCallback(() => {
    if (!workoutData || !event) return;
    setEditingExercises([...workoutData.exercises]);
    setEditingTitle(event.title);
    setIsEditMode(true);
  }, [event, workoutData]);

  const exitEditMode = useCallback(
    (save: boolean) => {
      if (save && event && workoutData) {
        const updatedData = { ...workoutData, exercises: editingExercises };
        updateWorkout.mutate(
          { id: event.id, data: updatedData, date: event.date, type: event.type },
          { onError: () => showError('운동 저장에 실패했습니다.') },
        );

        const trimmed = editingTitle.trim();
        if (trimmed && trimmed !== event.title) {
          updateEvent.mutate({ id: event.id, data: { title: trimmed } });
        }
      }

      setIsEditMode(false);
      setEditingExercises([]);
      setEditingTitle('');
    },
    [editingExercises, editingTitle, event, showError, updateEvent, updateWorkout, workoutData],
  );

  const handleEditSetsChange = useCallback((exerciseId: string, sets: WorkoutSet[]) => {
    setEditingExercises((prev) =>
      prev.map((exercise) => (exercise.id === exerciseId ? { ...exercise, sets } : exercise)),
    );
  }, []);

  const handleAddExercises = useCallback((newExercises: WorkoutExercise[]) => {
    setEditingExercises((prev) => [...prev, ...newExercises]);
  }, []);

  const session = useWorkoutSession({
    exercises: workoutData?.exercises ?? [],
    eventId: event?.id ?? '',
    date,
  });

  useEffect(() => {
    if (event?.title && onTitleChange) {
      onTitleChange(event.title);
    }
  }, [event?.title, onTitleChange]);

  const handleHeaderSave = useCallback(() => {
    exitEditMode(true);
  }, [exitEditMode]);

  useEventHeaderActions({
    event,
    isEditMode,
    onHeaderAction,
    onEnterEditMode: enterEditMode,
    onExitEditMode: handleHeaderSave,
    onDelete: handleDelete,
  });

  if (!event) {
    return (
      <>
        <div className="mt-8">
          <EmptyState
            icon={CalendarIcon}
            message={`${formattedDate}에 예정된 운동이 없습니다.`}
            showIconBackground
            size="lg"
          />
          <div className="flex flex-col gap-3 mt-6 px-4">
            <button
              type="button"
              onClick={() => router.push('/routine/counselor')}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-primary text-primary-foreground"
            >
              <RobotIcon size={18} />
              AI 상담사에게 맡기기
            </button>
            <button
              type="button"
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

  if (session.state.phase === 'active') {
    return <ActiveWorkout session={session} />;
  }

  if (session.state.phase === 'complete') {
    return <WorkoutComplete session={session} onDone={handleComplete} isLoading={isCompleting} />;
  }

  return (
    <>
      <div className="space-y-10">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <eventConfig.icon size={18} className={eventConfig.color} weight="fill" />
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
            <EventStatusBadge status={event.status} date={event.date} />
          </div>

          {isEditMode && (
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              className="w-full mt-3 text-lg font-semibold text-foreground bg-transparent border-b border-border focus:border-primary focus:outline-none pb-1"
              placeholder="루틴 제목"
            />
          )}

          {!isEditMode && event.rationale && (
            <p className="text-sm text-muted-foreground mt-2">{event.rationale}</p>
          )}
        </div>

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
            {event.status === 'scheduled' && (
              <button
                type="button"
                onClick={() => {
                  enterEditMode();
                  setIsAddExerciseSheetOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground"
              >
                <PlusIcon size={16} weight="bold" />
                운동 추가
              </button>
            )}
          </div>
        ) : (
          <div className="bg-muted/50 rounded-xl p-6 text-center">
            <p className="text-muted-foreground">상세 운동 정보가 없습니다.</p>
          </div>
        )}

        {workoutData?.notes && (
          <div className="bg-muted/20 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">메모</h3>
            <p className="text-foreground">{workoutData.notes}</p>
          </div>
        )}
      </div>

      {!isEditMode && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-safe bg-background border-t border-border">
          <EventActionButtons
            status={event.status}
            date={event.date}
            mode="start"
            onComplete={handleComplete}
            onUncomplete={handleUncomplete}
            onStart={session.startWorkout}
            isLoading={isCompleting || isUncompleting}
            startDisabled={!isToday}
            hasActiveSession={session.hasActiveSession}
          />
        </div>
      )}

      <AddExerciseSheet
        isOpen={isAddExerciseSheetOpen}
        onClose={() => setIsAddExerciseSheetOpen(false)}
        onAdd={handleAddExercises}
        existingNames={new Set(editingExercises.map((exercise) => exercise.name))}
      />
    </>
  );
}
