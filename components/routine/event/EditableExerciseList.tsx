'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import SortableExerciseCard from './SortableExerciseCard';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import type { WorkoutExercise, WorkoutSet } from '@/lib/types/routine';

interface EditableExerciseListProps {
  exercises: WorkoutExercise[];
  onExercisesChange: (exercises: WorkoutExercise[]) => void;
  onSetsChange: (exerciseId: string, sets: WorkoutSet[]) => void;
}

/**
 * 편집 모드 운동 목록
 *
 * - 드래그 앤 드롭으로 순서 변경
 * - 개별 운동 삭제 (최소 1개 유지)
 * - 세트 인라인 편집 가능
 */
export default function EditableExerciseList({
  exercises,
  onExercisesChange,
  onSetsChange,
}: EditableExerciseListProps) {
  const confirm = useConfirmDialog();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = exercises.findIndex((e) => e.id === active.id);
    const newIndex = exercises.findIndex((e) => e.id === over.id);
    onExercisesChange(arrayMove(exercises, oldIndex, newIndex));
  };

  const handleDelete = (exercise: WorkoutExercise) => {
    confirm({
      title: '운동을 삭제할까요?',
      message: `${exercise.name}을(를) 목록에서 삭제합니다`,
      confirmText: '삭제',
      onConfirm: () => {
        onExercisesChange(exercises.filter((e) => e.id !== exercise.id));
      },
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={exercises.map((e) => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <SortableExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={index}
              onDelete={() => handleDelete(exercise)}
              canDelete={exercises.length > 1}
              onSetsChange={onSetsChange}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
