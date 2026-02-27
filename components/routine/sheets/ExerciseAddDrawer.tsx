'use client';

import { useState } from 'react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import { MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react';
import ChipButton from '@/components/ui/ChipButton';
import SheetFooterAction from '@/components/ui/SheetFooterAction';
import { searchExercises, EXERCISE_CATEGORIES } from '@/lib/data/exercises';
import type { ExerciseCategory, ExerciseInfo } from '@/lib/data/exercises';
import type { WorkoutExercise, WorkoutSet } from '@/lib/types/routine';

// ============================================================================
// Types
// ============================================================================

interface ExerciseAddDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (exercises: WorkoutExercise[]) => void;
  existingNames: Set<string>;
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
// Main Component
// ============================================================================

export default function ExerciseAddDrawer({
  isOpen,
  onClose,
  onAdd,
  existingNames,
}: ExerciseAddDrawerProps) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExerciseCategory | null>(null);
  const [selected, setSelected] = useState<WorkoutExercise[]>([]);

  const searchResults = searchExercises(query, categoryFilter ?? undefined);

  // 이미 워크아웃에 있는 이름 + 이번에 선택한 이름
  const disabledNames = new Set([
    ...existingNames,
    ...selected.map((e) => e.name),
  ]);

  const handleSelect = (info: ExerciseInfo) => {
    setSelected((prev) => [...prev, catalogToExercise(info)]);
  };

  const handleRemove = (index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    onAdd(selected);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setQuery('');
    setCategoryFilter(null);
    setSelected([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="운동 추가"
      position="bottom"
      height="full"
      showCloseButton
      stickyFooter={
        <SheetFooterAction
          label={selected.length > 0 ? `${selected.length}개 운동 추가` : '운동을 선택해주세요'}
          onClick={handleConfirm}
          disabled={selected.length === 0}
        />
      }
    >
      <ModalBody className="p-4 space-y-4">
        {/* 검색 */}
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-muted text-sm placeholder:text-hint focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <ChipButton
              selected={!categoryFilter}
              onClick={() => setCategoryFilter(null)}
            >
              전체
            </ChipButton>
            {EXERCISE_CATEGORIES.map((cat) => (
              <ChipButton
                key={cat}
                selected={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
              >
                {cat}
              </ChipButton>
            ))}
          </div>
        </div>

        {/* 선택된 운동 칩 */}
        {selected.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              선택된 운동 ({selected.length}개)
            </h3>
            <div className="flex flex-wrap gap-2">
              {selected.map((exercise, index) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface-accent text-primary rounded-full"
                >
                  {exercise.name}
                  <span className="text-primary/60">×</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 운동 목록 */}
        <div className="rounded-xl border border-edge-subtle divide-y divide-edge-faint max-h-[60vh] overflow-y-auto">
          {searchResults.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground text-center">
              결과 없음
            </p>
          ) : (
            searchResults.map((item) => {
              const isDisabled = disabledNames.has(item.name);
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left disabled:opacity-40"
                >
                  <div>
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {item.targetMuscle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                    {!isDisabled && (
                      <PlusIcon size={14} className="text-muted-foreground" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
