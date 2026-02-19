'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ExerciseCard from './ExerciseCard';
import type { WorkoutExercise, WorkoutSet } from '@/lib/types/routine';

interface SortableExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  onDelete: () => void;
  canDelete: boolean;
  onSetsChange: (exerciseId: string, sets: WorkoutSet[]) => void;
}

export default function SortableExerciseCard({
  exercise,
  index,
  onDelete,
  canDelete,
  onSetsChange,
}: SortableExerciseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : ('auto' as const),
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ExerciseCard
        exercise={exercise}
        index={index}
        editable
        editMode
        onDelete={onDelete}
        canDelete={canDelete}
        onSetsChange={onSetsChange}
        dragHandleProps={listeners}
      />
    </div>
  );
}
