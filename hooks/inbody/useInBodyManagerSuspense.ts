'use client';

import { useState } from 'react';
import { InBodyRecord } from '@/lib/types/inbody';
import { useInBodyRecordsSuspense, useInBodySummarySuspense } from './queries';
import { useDeleteInBody } from './mutations';

// ============================================================
// Types
// ============================================================

type ManagerView = 'list' | 'confirm-delete';

interface UseInBodyManagerSuspenseOptions {
  /** 초기 로드할 레코드 수 */
  initialLimit?: number;
}

interface UseInBodyManagerSuspenseReturn {
  // Data (항상 존재 - Suspense가 로딩 처리)
  records: InBodyRecord[];
  summary: ReturnType<typeof useInBodySummarySuspense>['data'];

  // View State
  currentView: ManagerView;

  // Selected Record State
  selectedRecord: InBodyRecord | null;
  recordToDelete: InBodyRecord | null;

  // Detail Modal State
  isDetailModalOpen: boolean;

  // Actions
  openDetailModal: (record: InBodyRecord) => void;
  closeDetailModal: () => void;
  requestDelete: (record: InBodyRecord) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;

  // Delete State
  isDeleting: boolean;
}

// ============================================================
// Hook
// ============================================================

/**
 * InBody 관리 페이지를 위한 통합 상태 관리 훅 (Suspense 버전)
 *
 * Suspense boundary 내부에서 사용해야 합니다.
 * data는 항상 존재합니다 (Suspense가 로딩 처리).
 */
export function useInBodyManagerSuspense(
  options: UseInBodyManagerSuspenseOptions = {}
): UseInBodyManagerSuspenseReturn {
  const { initialLimit = 50 } = options;

  // ========== Data Fetching (Suspense) ==========
  const { data: records } = useInBodyRecordsSuspense(initialLimit, 0);
  const { data: summary } = useInBodySummarySuspense();

  const deleteInBody = useDeleteInBody();

  // ========== View State ==========
  const [currentView, setCurrentView] = useState<ManagerView>('list');

  // ========== Selection State ==========
  const [selectedRecord, setSelectedRecord] = useState<InBodyRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<InBodyRecord | null>(null);

  // ========== Detail Modal State ==========
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // ========== Detail Modal Actions ==========
  const openDetailModal = (record: InBodyRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRecord(null);
  };

  // ========== Delete Actions ==========
  const requestDelete = (record: InBodyRecord) => {
    setRecordToDelete(record);
    setCurrentView('confirm-delete');
  };

  const confirmDelete = () => {
    if (!recordToDelete) return;

    deleteInBody.mutate(recordToDelete.id, {
      onSuccess: () => {
        setCurrentView('list');
        setRecordToDelete(null);
      },
    });
  };

  const cancelDelete = () => {
    setCurrentView('list');
    setRecordToDelete(null);
  };

  // ========== Return ==========
  return {
    // Data (항상 존재)
    records,
    summary,

    // View State
    currentView,

    // Selected Record State
    selectedRecord,
    recordToDelete,

    // Detail Modal State
    isDetailModalOpen,

    // Actions
    openDetailModal,
    closeDetailModal,
    requestDelete,
    confirmDelete,
    cancelDelete,

    // Delete State
    isDeleting: deleteInBody.isPending,
  };
}
