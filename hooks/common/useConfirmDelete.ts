'use client';

import { useConfirmDialog } from '@/lib/stores';

interface ConfirmDeleteOptions {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
}

export function useConfirmDelete() {
  const confirmDialog = useConfirmDialog();
  return (options: ConfirmDeleteOptions) =>
    confirmDialog({ ...options, variant: 'danger', confirmText: '삭제' });
}
