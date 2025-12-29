'use client';

import { useState, useCallback, useMemo } from 'react';
import { InBodyRecord, InBodyCreateData } from '@/lib/types/inbody';
import { useInBodyRecords, useInBodySummary, useDeleteInBody, useCreateInBody } from './useInBody';
import { useNativeImagePicker } from '@/hooks/webview';

// ============================================================
// Types
// ============================================================

type ManagerView = 'list' | 'confirm-delete';
type ScanState = 'idle' | 'scanning' | 'preview' | 'saving' | 'error';

interface UseInBodyManagerOptions {
  /** 초기 로드할 레코드 수 */
  initialLimit?: number;
}

interface UseInBodyManagerReturn {
  // Data
  records: InBodyRecord[];
  summary: ReturnType<typeof useInBodySummary>['data'];
  isLoading: boolean;

  // View State
  currentView: ManagerView;

  // Selected Record State
  selectedRecord: InBodyRecord | null;
  recordToDelete: InBodyRecord | null;

  // Scan State (모달 대신 직접 관리)
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
  saveScanData: () => Promise<void>;
  closePreviewModal: () => void;
  openDetailModal: (record: InBodyRecord) => void;
  closeDetailModal: () => void;
  requestDelete: (record: InBodyRecord) => void;
  confirmDelete: () => Promise<void>;
  cancelDelete: () => void;

  // Delete State
  isDeleting: boolean;
  isSaving: boolean;
}

// ============================================================
// Hook
// ============================================================

/**
 * InBody 관리 페이지를 위한 통합 상태 관리 훅
 *
 * @description
 * - 레코드 목록 및 요약 데이터 페칭
 * - 스캔/상세 모달 상태 관리
 * - 삭제 확인 플로우 관리
 *
 * @example
 * ```tsx
 * const {
 *   records,
 *   isLoading,
 *   openScanModal,
 *   requestDelete,
 *   confirmDelete,
 * } = useInBodyManager();
 * ```
 */
export function useInBodyManager(
  options: UseInBodyManagerOptions = {}
): UseInBodyManagerReturn {
  const { initialLimit = 50 } = options;

  // ========== Data Fetching ==========
  const {
    data: records = [],
    isLoading: isRecordsLoading
  } = useInBodyRecords(initialLimit, 0);

  const {
    data: summary,
    isLoading: isSummaryLoading
  } = useInBodySummary();

  const deleteInBody = useDeleteInBody();
  const createInBody = useCreateInBody();
  const { pickImage, base64ToFile } = useNativeImagePicker();

  // ========== View State ==========
  const [currentView, setCurrentView] = useState<ManagerView>('list');

  // ========== Selection State ==========
  const [selectedRecord, setSelectedRecord] = useState<InBodyRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<InBodyRecord | null>(null);

  // ========== Scan State (모달 없이 직접 관리) ==========
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanData, setScanData] = useState<InBodyCreateData | null>(null);
  const [scanImagePreview, setScanImagePreview] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // ========== Detail Modal State ==========
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // ========== Scan Actions (직접 픽커 호출) ==========
  const startScan = useCallback(async () => {
    // 1. 이미지 픽커 호출
    const result = await pickImage('both');

    if (result.cancelled) {
      return;
    }

    if (!result.success || !result.base64) {
      setScanError(result.error || '이미지 선택에 실패했습니다.');
      setScanState('error');
      return;
    }

    // 2. 스캔 시작
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
        throw new Error(errorData.error || '스캔에 실패했습니다.');
      }

      const scanResult = await response.json();
      setScanData(scanResult.createData);
      setScanState('preview');
      setIsPreviewModalOpen(true);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : '스캔 중 오류가 발생했습니다.');
      setScanState('error');
    }
  }, [pickImage, base64ToFile]);

  const resetScan = useCallback(() => {
    setScanState('idle');
    setScanError(null);
    setScanData(null);
    setScanImagePreview(null);
    setIsPreviewModalOpen(false);
  }, []);

  const updateScanData = useCallback((data: InBodyCreateData) => {
    setScanData(data);
  }, []);

  const saveScanData = useCallback(async () => {
    if (!scanData) return;

    setScanState('saving');
    try {
      await createInBody.mutateAsync(scanData);
      resetScan();
    } catch (err) {
      setScanError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      setScanState('error');
    }
  }, [scanData, createInBody, resetScan]);

  const closePreviewModal = useCallback(() => {
    resetScan();
  }, [resetScan]);

  // ========== Detail Modal Actions ==========
  const openDetailModal = useCallback((record: InBodyRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedRecord(null);
  }, []);

  // ========== Delete Actions ==========
  const requestDelete = useCallback((record: InBodyRecord) => {
    setRecordToDelete(record);
    setCurrentView('confirm-delete');
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!recordToDelete) return;

    try {
      await deleteInBody.mutateAsync(recordToDelete.id);
      setCurrentView('list');
      setRecordToDelete(null);
    } catch (error) {
      console.error('Failed to delete InBody record:', error);
      throw error;
    }
  }, [recordToDelete, deleteInBody]);

  const cancelDelete = useCallback(() => {
    setCurrentView('list');
    setRecordToDelete(null);
  }, []);

  // ========== Computed State ==========
  const isLoading = useMemo(
    () => isRecordsLoading || isSummaryLoading,
    [isRecordsLoading, isSummaryLoading]
  );

  // ========== Return ==========
  return {
    // Data
    records,
    summary,
    isLoading,

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

export default useInBodyManager;
