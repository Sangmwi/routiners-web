'use client';

import { useState } from 'react';
import { InBodyRecord, InBodyCreateData } from '@/lib/types/inbody';
import { useInBodyRecordsSuspense, useInBodySummarySuspense } from './queries';
import { useDeleteInBody, useCreateInBody } from './mutations';
import { useNativeImagePicker } from '@/hooks/webview';

// ============================================================
// Types
// ============================================================

type ManagerView = 'list' | 'confirm-delete';
type ScanState = 'idle' | 'scanning' | 'preview' | 'saving' | 'error';

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

  // Scan State
  scanState: ScanState;
  scanError: string | null;
  scanData: InBodyCreateData | null;
  scanImagePreview: string | null;
  isPreviewModalOpen: boolean;

  // Detail Modal State
  isDetailModalOpen: boolean;

  // Actions
  startScan: () => Promise<void>;
  resetScan: () => void;
  updateScanData: (data: InBodyCreateData) => void;
  saveScanData: () => void;
  closePreviewModal: () => void;
  openDetailModal: (record: InBodyRecord) => void;
  closeDetailModal: () => void;
  requestDelete: (record: InBodyRecord) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;

  // Delete State
  isDeleting: boolean;
  isSaving: boolean;
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
  const createInBody = useCreateInBody();
  const { pickImage, base64ToFile } = useNativeImagePicker();

  // ========== View State ==========
  const [currentView, setCurrentView] = useState<ManagerView>('list');

  // ========== Selection State ==========
  const [selectedRecord, setSelectedRecord] = useState<InBodyRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<InBodyRecord | null>(null);

  // ========== Scan State ==========
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanData, setScanData] = useState<InBodyCreateData | null>(null);
  const [scanImagePreview, setScanImagePreview] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // ========== Detail Modal State ==========
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // ========== Scan Actions ==========
  const startScan = async () => {
    const result = await pickImage('both');

    if (result.cancelled) {
      return;
    }

    if (!result.success || !result.base64) {
      setScanError(result.error || '이미지 선택에 실패했어요.');
      setScanState('error');
      return;
    }

    setScanImagePreview(result.base64);
    setScanState('scanning');
    setScanError(null);

    try {
      const file = base64ToFile(result.base64, result.fileName || 'inbody.jpg');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/inbody/scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '스캔에 실패했어요.');
      }

      const scanResult = await response.json();
      setScanData(scanResult.createData);
      setScanState('preview');
      setIsPreviewModalOpen(true);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : '스캔 중 오류가 발생했어요.');
      setScanState('error');
    }
  };

  const resetScan = () => {
    setScanState('idle');
    setScanError(null);
    setScanData(null);
    setScanImagePreview(null);
    setIsPreviewModalOpen(false);
  };

  const updateScanData = (data: InBodyCreateData) => {
    setScanData(data);
  };

  const saveScanData = () => {
    if (!scanData) return;

    setScanState('saving');
    createInBody.mutate(scanData, {
      onSuccess: () => resetScan(),
      onError: (err) => {
        setScanError(err instanceof Error ? err.message : '저장에 실패했어요.');
        setScanState('error');
      },
    });
  };

  const closePreviewModal = () => {
    resetScan();
  };

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

    // Scan State
    scanState,
    scanError,
    scanData,
    scanImagePreview,
    isPreviewModalOpen,

    // Detail Modal State
    isDetailModalOpen,

    // Actions
    startScan,
    resetScan,
    updateScanData,
    saveScanData,
    closePreviewModal,
    openDetailModal,
    closeDetailModal,
    requestDelete,
    confirmDelete,
    cancelDelete,

    // Delete State
    isDeleting: deleteInBody.isPending,
    isSaving: createInBody.isPending,
  };
}
