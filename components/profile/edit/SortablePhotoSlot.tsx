'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DraftImage } from '@/hooks/profile/useProfileImagesDraft';

interface SortablePhotoSlotProps {
  image: DraftImage;
  index: number;
  isFirst: boolean;
  isProcessing: boolean;
  isSelected: boolean;
  onDelete: () => void;
  onSelect: () => void;
  children: (props: { isDragging: boolean }) => React.ReactNode;
}

export default function SortablePhotoSlot({
  image,
  isProcessing,
  children,
}: SortablePhotoSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id, disabled: isProcessing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children({ isDragging })}
    </div>
  );
}
