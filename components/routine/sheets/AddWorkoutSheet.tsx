'use client';

import { useState } from 'react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  SpinnerGapIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useCreateRoutineEvent } from '@/hooks/routine';
import { useShowError } from '@/lib/stores/errorStore';
import { useRouter } from 'next/navigation';
import { searchExercises, generateWorkoutTitle, EXERCISE_CATEGORIES } from '@/lib/data/exercises';
import type { ExerciseCategory, ExerciseInfo } from '@/lib/data/exercises';
import type { WorkoutExercise, WorkoutSet, RoutineEventCreateData } from '@/lib/types/routine';

// ============================================================================
// Types
// ============================================================================

interface AddWorkoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
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
  };
}

// ============================================================================
// Sub Components
// ============================================================================

interface NumberStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
}

function NumberStepper({ value, onChange, min = 0, step = 1, suffix }: NumberStepperProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground active:bg-muted"
      >
        <MinusIcon size={14} />
      </button>
      <span className="w-12 text-center text-sm font-medium tabular-nums">
        {value}{suffix}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + step)}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground active:bg-muted"
      >
        <PlusIcon size={14} />
      </button>
    </div>
  );
}

interface ExerciseSetRowProps {
  set: WorkoutSet;
  onChange: (updated: WorkoutSet) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function ExerciseSetRow({ set, onChange, onRemove, canRemove }: ExerciseSetRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-8">S{set.setNumber}</span>
      <NumberStepper
        value={set.targetReps}
        onChange={(v) => onChange({ ...set, targetReps: v })}
        min={1}
        suffix="회"
      />
      <NumberStepper
        value={set.targetWeight ?? 0}
        onChange={(v) => onChange({ ...set, targetWeight: v })}
        step={2.5}
        suffix="kg"
      />
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
  const updateSet = (index: number, updated: WorkoutSet) => {
    const sets = [...exercise.sets];
    sets[index] = updated;
    onUpdate({ ...exercise, sets });
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
        ...(lastSet ? [] : []),
      ].map((s, i) => ({
        ...s,
        setNumber: i + 1,
        targetReps: lastSet?.targetReps ?? 10,
        targetWeight: lastSet?.targetWeight ?? 20,
      })),
    });
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
            onChange={(updated) => updateSet(i, updated)}
            onRemove={() => removeSet(i)}
            canRemove={exercise.sets.length > 1}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addSet}
        className="w-full py-1.5 text-xs text-primary font-medium"
      >
        + 세트 추가
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AddWorkoutSheet({ isOpen, onClose, date }: AddWorkoutSheetProps) {
  const router = useRouter();
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
        router.refresh();
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
      <ModalBody className="space-y-5 pb-32">
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
          {createEvent.isPending && <SpinnerGapIcon size={16} className="animate-spin" />}
          {createEvent.isPending ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </Modal>
  );
}
