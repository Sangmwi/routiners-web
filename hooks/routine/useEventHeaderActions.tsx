'use client';

import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { useEffect, type ReactNode } from 'react';
import type { EventStatus } from '@/lib/types/routine';

interface HeaderEventLike {
  id: string;
  status: EventStatus;
}

interface UseEventHeaderActionsOptions {
  event: HeaderEventLike | null;
  isEditMode: boolean;
  onHeaderAction?: (action: ReactNode) => void;
  onEnterEditMode?: () => void;
  onExitEditMode: () => void;
  onDelete: () => void;
}

export function useEventHeaderActions({
  event,
  isEditMode,
  onHeaderAction,
  onEnterEditMode,
  onExitEditMode,
  onDelete,
}: UseEventHeaderActionsOptions) {
  useEffect(() => {
    if (!onHeaderAction) return;

    if (!event) {
      onHeaderAction(null);
      return;
    }

    if (isEditMode) {
      onHeaderAction(
        <button
          type="button"
          onClick={onExitEditMode}
          className="px-3 py-1 text-sm font-medium text-primary"
        >
          완료
        </button>,
      );
      return;
    }

    if (event.status === 'scheduled' && onEnterEditMode) {
      onHeaderAction(
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEnterEditMode}
            className="p-1 text-muted-foreground"
            aria-label="편집"
          >
            <PencilSimpleIcon size={20} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-muted-foreground"
            aria-label="삭제"
          >
            <TrashIcon size={20} />
          </button>
        </div>,
      );
      return;
    }

    onHeaderAction(
      <button
        type="button"
        onClick={onDelete}
        className="p-1 text-muted-foreground"
        aria-label="삭제"
      >
        <TrashIcon size={20} />
      </button>,
    );
  }, [
    event,
    event?.id,
    event?.status,
    isEditMode,
    onDelete,
    onEnterEditMode,
    onExitEditMode,
    onHeaderAction,
  ]);
}
