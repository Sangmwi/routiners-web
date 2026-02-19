'use client';

import { useState } from 'react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  XIcon,
  PencilSimpleIcon,
  TimerIcon,
} from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';
import SetValuePicker from '@/components/routine/workout/SetValuePicker';
import { useCreateRoutineEvent } from '@/hooks/routine';
import { useSetValuePicker } from '@/hooks/routine/useSetValuePicker';
import { useShowError } from '@/lib/stores/errorStore';
import { searchExercises, generateWorkoutTitle, EXERCISE_CATEGORIES } from '@/lib/data/exercises';
import { REST_OPTIONS, formatRestSeconds } from '@/lib/utils/workoutHelpers';
import type { ExerciseCategory, ExerciseInfo } from '@/lib/data/exercises';
import type { WorkoutExercise, WorkoutSet, RoutineEventCreateData } from '@/lib/types/routine';

// ============================================================================
// Types
// ============================================================================

interface AddWorkoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  onCreated?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function createWorkoutSet(setNumber: number): WorkoutSet {
  return { setNumber, targetReps: 10, targetWeight: 20 };
}

function catalogToExercise(info: ExerciseInfo): WorkoutExercise {
  return {
    id: crypto.randomUUID(),
    name: info.name,
    category: info.category,
    targetMuscle: info.targetMuscle,
    sets: [createWorkoutSet(1), createWorkoutSet(2), createWorkoutSet(3)],
    restSeconds: 60,
  };
}

// ============================================================================
// Sub Components
// ============================================================================

interface ExerciseSetRowProps {
  set: WorkoutSet;
  onTapEdit: () => void;
  onRemove: () => void;
  canRemove: boolean;
}

function ExerciseSetRow({ set, onTapEdit, onRemove, canRemove }: ExerciseSetRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/20 px-4 py-3">
      <span className="text-xs text-muted-foreground shrink-0">{set.setNumber}세트</span>
      <button
        type="button"
        onClick={onTapEdit}
        className="flex-1 h-9 px-3 flex items-center justify-center gap-2 text-sm font-medium bg-background border border-border rounded-lg active:bg-muted/50 transition-colors"
      >
        <span className="tabular-nums">{set.targetWeight ?? 0}kg</span>
        <span className="text-muted-foreground">×</span>
        <span className="tabular-nums">{set.targetReps}회</span>
        <PencilSimpleIcon size={14} className="text-muted-foreground ml-1" />
      </button>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-muted-foreground/50"
        >
          <XIcon size={14} />
        </button>
      )}
    </div>
  );
}

interface SelectedExerciseCardProps {
  exercise: WorkoutExercise;
  onUpdate: (updated: WorkoutExercise) => void;
  onRemove: () => void;
}

function SelectedExerciseCard({ exercise, onUpdate, onRemove }: SelectedExerciseCardProps) {
  const { pickerSetIndex, pickerSet, openPicker, closePicker } = useSetValuePicker(exercise.sets);

  const handlePickerConfirm = (weight: number, reps: number) => {
    if (pickerSetIndex === null) return;
    const sets = exercise.sets.map((set, idx) =>
      idx === pickerSetIndex
        ? { ...set, targetWeight: weight, targetReps: reps }
        : set
    );
    onUpdate({ ...exercise, sets });
    closePicker();
  };

  const removeSet = (index: number) => {
    const sets = exercise.sets
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, setNumber: i + 1 }));
    onUpdate({ ...exercise, sets });
  };

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    onUpdate({
      ...exercise,
      sets: [
        ...exercise.sets,
        createWorkoutSet(exercise.sets.length + 1),
      ].map((s, i) => ({
        ...s,
        setNumber: i + 1,
        targetReps: lastSet?.targetReps ?? 10,
        targetWeight: lastSet?.targetWeight ?? 20,
      })),
    });
  };

  const cycleRestSeconds = () => {
    const current = exercise.restSeconds ?? 60;
    const currentIndex = REST_OPTIONS.indexOf(current);
    const nextIndex = (currentIndex + 1) % REST_OPTIONS.length;
    onUpdate({ ...exercise, restSeconds: REST_OPTIONS[nextIndex] });
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-sm">{exercise.name}</h4>
          <p className="text-xs text-muted-foreground">{exercise.targetMuscle}</p>
        </div>
        <button type="button" onClick={onRemove} className="p-1.5 text-muted-foreground/50">
          <TrashIcon size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {exercise.sets.map((set, i) => (
          <ExerciseSetRow
            key={set.setNumber}
            set={set}
            onTapEdit={() => openPicker(i)}
            onRemove={() => removeSet(i)}
            canRemove={exercise.sets.length > 1}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addSet}
          className="py-1.5 text-xs text-primary font-medium"
        >
          + 세트 추가
        </button>
        <button
          type="button"
          onClick={cycleRestSeconds}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground rounded-lg hover:bg-muted/30 transition-colors"
        >
          <TimerIcon size={14} />
          <span>휴식 {formatRestSeconds(exercise.restSeconds ?? 60)}</span>
        </button>
      </div>

      {pickerSet && pickerSetIndex !== null && (
        <SetValuePicker
          isOpen={true}
          onClose={closePicker}
          title={`${pickerSet.setNumber}세트`}
          weight={pickerSet.targetWeight ?? 0}
          reps={pickerSet.targetReps ?? 10}
          onConfirm={handlePickerConfirm}
        />
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AddWorkoutSheet({ isOpen, onClose, date, onCreated }: AddWorkoutSheetProps) {
  const showError = useShowError();
  const createEvent = useCreateRoutineEvent();

  // 검색 상태
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | null>(null);

  // 선택된 운동 목록
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  // 검색 결과
  const searchResults = searchExercises(query, categoryFilter ?? undefined);

  // 이미 선택된 운동 이름 Set (중복 추가 방지)
  const selectedNames = new Set(exercises.map((e) => e.name));

  // 자동 제목
  const autoTitle = generateWorkoutTitle(
    exercises.map((e) => ({
      id: e.id,
      name: e.name,
      category: (e.category ?? '전신') as ExerciseCategory,
      targetMuscle: e.targetMuscle ?? '',
    })),
  );

  const handleAddExercise = (info: ExerciseInfo) => {
    setExercises((prev) => [...prev, catalogToExercise(info)]);
    setQuery('');
  };

  const handleUpdateExercise = (index: number, updated: WorkoutExercise) => {
    setExercises((prev) => prev.map((e, i) => (i === index ? updated : e)));
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (exercises.length === 0) return;

    const eventData: RoutineEventCreateData = {
      type: 'workout',
      date,
      title: autoTitle,
      source: 'user',
      data: { exercises },
    };

    createEvent.mutate(eventData, {
      onSuccess: () => {
        onClose();
        setExercises([]);
        setQuery('');
        setCategoryFilter(null);
        onCreated?.();
      },
      onError: () => showError('운동 저장에 실패했어요'),
    });
  };

  const handleClose = () => {
    onClose();
    setExercises([]);
    setQuery('');
    setCategoryFilter(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="운동 추가"
      position="bottom"
      enableSwipe
      height="full"
      showCloseButton
    >
      <ModalBody className="p-4 space-y-5 pb-32">
        {/* 운동 검색 */}
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="운동 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setCategoryFilter(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${
                !categoryFilter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              전체
            </button>
            {EXERCISE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 검색 결과 */}
          {query && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-border/50 divide-y divide-border/30">
              {searchResults.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground text-center">
                  결과 없음
                </p>
              ) : (
                searchResults.slice(0, 20).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={selectedNames.has(item.name)}
                    onClick={() => handleAddExercise(item)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left disabled:opacity-40"
                  >
                    <div>
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {item.targetMuscle}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* 카테고리별 빠른 선택 (검색어 없을 때) */}
          {!query && exercises.length === 0 && (
            <div className="max-h-60 overflow-y-auto rounded-xl border border-border/50 divide-y divide-border/30">
              {searchResults.slice(0, 15).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAddExercise(item)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                >
                  <div>
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {item.targetMuscle}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 선택된 운동 목록 */}
        {exercises.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              선택된 운동 ({exercises.length}개)
              <span className="text-muted-foreground font-normal ml-2">{autoTitle}</span>
            </h3>
            {exercises.map((exercise, index) => (
              <SelectedExerciseCard
                key={exercise.id}
                exercise={exercise}
                onUpdate={(updated) => handleUpdateExercise(index, updated)}
                onRemove={() => handleRemoveExercise(index)}
              />
            ))}
          </div>
        )}
      </ModalBody>

      {/* 저장 버튼 (고정) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border/50 pb-safe">
        <button
          type="button"
          onClick={handleSave}
          disabled={exercises.length === 0 || createEvent.isPending}
          className="w-full py-3.5 rounded-xl font-medium bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {createEvent.isPending && <LoadingSpinner size="sm" variant="current" />}
          {createEvent.isPending ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </Modal>
  );
}
