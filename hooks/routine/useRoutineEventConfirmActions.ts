'use client';

import { useConfirmDialog } from '@/lib/stores/modalStore';
import type { RoutineEvent } from '@/lib/types/routine';
import { useRoutineEventActions } from './useRoutineEventActions';

interface ConfirmCopy {
  title: string;
  message: string;
  confirmText: string;
}

interface ConfirmActionOptions {
  errorMessage: string;
  copy?: Partial<ConfirmCopy>;
}

const DEFAULT_DELETE_CONFIRM_COPY: ConfirmCopy = {
  title: '루틴을 삭제하시겠어요?',
  message: '삭제하면 되돌릴 수 없어요.',
  confirmText: '삭제',
};

const DEFAULT_UNCOMPLETE_CONFIRM_COPY: ConfirmCopy = {
  title: '완료를 되돌리시겠어요?',
  message: '루틴이 미완료 상태로 돌아가요.',
  confirmText: '되돌리기',
};

function buildConfirmCopy(
  fallback: ConfirmCopy,
  override?: Partial<ConfirmCopy>,
): ConfirmCopy {
  return {
    title: override?.title ?? fallback.title,
    message: override?.message ?? fallback.message,
    confirmText: override?.confirmText ?? fallback.confirmText,
  };
}

export function useRoutineEventConfirmActions() {
  const confirm = useConfirmDialog();
  const { deleteEventAndGoBack, uncompleteEvent, isDeleting, isUncompleting } =
    useRoutineEventActions();

  const confirmDelete = (event: RoutineEvent, options: ConfirmActionOptions) => {
    const copy = buildConfirmCopy(DEFAULT_DELETE_CONFIRM_COPY, options.copy);
    confirm({
      ...copy,
      onConfirm: () =>
        deleteEventAndGoBack(event, {
          errorMessage: options.errorMessage,
        }),
    });
  };

  const confirmUncomplete = (event: RoutineEvent, options: ConfirmActionOptions) => {
    const copy = buildConfirmCopy(DEFAULT_UNCOMPLETE_CONFIRM_COPY, options.copy);
    confirm({
      ...copy,
      onConfirm: () =>
        uncompleteEvent(event, {
          errorMessage: options.errorMessage,
        }),
    });
  };

  return {
    confirmDelete,
    confirmUncomplete,
    isDeleting,
    isUncompleting,
  };
}
