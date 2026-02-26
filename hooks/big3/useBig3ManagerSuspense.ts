'use client';

import { useState } from 'react';
import type { Big3Record, Big3LiftType } from '@/lib/types/big3';
import { useInfiniteBig3RecordsSuspense, useBig3SummarySuspense } from './queries';
import { useDeleteBig3 } from './mutations';

// ============================================================
// Types
// ============================================================

type ManagerView = 'list' | 'confirm-delete';

interface UseBig3ManagerSuspenseReturn {
  // Data
  records: Big3Record[];
  summary: ReturnType<typeof useBig3SummarySuspense>['data'];

  // Infinite Scroll
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;

  // Filter State
  selectedLiftType: Big3LiftType | undefined;
  setSelectedLiftType: (liftType: Big3LiftType | undefined) => void;

  // View State
  currentView: ManagerView;

  // Selected Record State
  selectedRecord: Big3Record | null;
  recordToDelete: Big3Record | null;

  // Detail Modal State
  isDetailModalOpen: boolean;

  // Actions
  openDetailModal: (record: Big3Record) => void;
  closeDetailModal: () => void;
  requestDelete: (record: Big3Record) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;

  // Delete State
  isDeleting: boolean;
}

// ============================================================
// Hook
// ============================================================

/**
 * Big3 관리 페이지를 위한 통합 상태 관리 훅 (Suspense 버전)
 */
export function useBig3ManagerSuspense(): UseBig3ManagerSuspenseReturn {
  // ========== Filter State ==========
  const [selectedLiftType, setSelectedLiftType] = useState<Big3LiftType | undefined>(undefined);

  // ========== Data Fetching (Suspense) ==========
  const {
    data: recordsData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteBig3RecordsSuspense(selectedLiftType);
  const records = recordsData.pages.flatMap((page) => page.records);
  const { data: summary } = useBig3SummarySuspense();

  const deleteBig3 = useDeleteBig3();

  // ========== View State ==========
  const [currentView, setCurrentView] = useState<ManagerView>('list');

  // ========== Selection State ==========
  const [selectedRecord, setSelectedRecord] = useState<Big3Record | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<Big3Record | null>(null);

  // ========== Detail Modal State ==========
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const openDetailModal = (record: Big3Record) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRecord(null);
  };

  // ========== Delete Actions ==========
  const requestDelete = (record: Big3Record) => {
    setRecordToDelete(record);
    setCurrentView('confirm-delete');
  };

  const confirmDelete = () => {
    if (!recordToDelete) return;

    deleteBig3.mutate(recordToDelete.id, {
      onSuccess: () => {
        setCurrentView('list');
        setRecordToDelete(null);
        closeDetailModal();
      },
    });
  };

  const cancelDelete = () => {
    setCurrentView('list');
    setRecordToDelete(null);
  };

  return {
    records,
    summary,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    isFetchingNextPage,
    selectedLiftType,
    setSelectedLiftType,
    currentView,
    selectedRecord,
    recordToDelete,
    isDetailModalOpen,
    openDetailModal,
    closeDetailModal,
    requestDelete,
    confirmDelete,
    cancelDelete,
    isDeleting: deleteBig3.isPending,
  };
}
