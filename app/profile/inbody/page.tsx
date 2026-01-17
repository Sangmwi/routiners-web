'use client';

import { useRouter } from 'next/navigation';
import { PlusIcon, SpinnerGapIcon, WarningCircleIcon, CheckCircleIcon } from '@phosphor-icons/react';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/ui/Button';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import { PageSkeleton } from '@/components/ui/Skeleton';
import {
  InBodyRecordList,
  InBodySummaryCard,
  InBodyDetailModal,
  InBodyVisibilitySettings,
  InBodyPreview,
} from '@/components/inbody';
import { useInBodyManager } from '@/hooks/inbody';

// ============================================================
// Sub Components
// ============================================================

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="text-center">
        <WarningCircleIcon size={48} className="text-destructive mx-auto mb-4" />
        <p className="mb-4 text-sm text-muted-foreground">
          인바디 기록을 불러올 수 없습니다
        </p>
        <button
          onClick={onRetry}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

interface DeleteConfirmViewProps {
  recordDate: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmView({
  recordDate,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <WarningCircleIcon size={48} className="text-destructive mb-4" />
      <p className="text-lg font-medium text-card-foreground">
        이 기록을 삭제할까요?
      </p>
      <p className="text-sm text-muted-foreground mt-2">{recordDate} 측정 기록</p>
      <p className="text-xs text-muted-foreground mt-1">
        삭제된 기록은 복구할 수 없습니다
      </p>

      <div className="flex gap-3 mt-6 w-full max-w-xs">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isDeleting}
        >
          취소
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          className="flex-1"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <SpinnerGapIcon size={16} className="mr-2 animate-spin" />
              삭제 중...
            </>
          ) : (
            '삭제'
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================

export default function InBodyManagePage() {
  const router = useRouter();

  const {
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
    updateScanData,
    saveScanData,
    closePreviewModal,
    openDetailModal,
    closeDetailModal,
    requestDelete,
    confirmDelete,
    cancelDelete,

    // Delete State
    isDeleting,
  } = useInBodyManager();

  // ========== Handlers ==========

  const handleBack = () => {
    router.back();
  };

  // ========== Render ==========

  if (isLoading) {
    return <PageSkeleton />;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 버튼 비활성화 조건: 스캔 중이거나 저장 중
  const isButtonDisabled = scanState === 'scanning' || scanState === 'saving';

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="인바디 관리" onBack={handleBack} centered />

      <div className="p-4 space-y-6 pb-32">
        {/* Summary Card */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            최근 측정
          </h2>
          <InBodySummaryCard
            latest={summary?.latest}
            totalRecords={summary?.totalRecords}
          />
        </section>

        {/* Visibility Settings */}
        <section>
          <InBodyVisibilitySettings variant="card" />
        </section>

        {/* Record List or Delete Confirm */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              측정 기록
            </h2>
            <span className="text-xs text-muted-foreground">
              {records.length}개
            </span>
          </div>

          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {currentView === 'list' ? (
              <InBodyRecordList
                records={records}
                onRecordClick={openDetailModal}
                onDeleteClick={requestDelete}
              />
            ) : currentView === 'confirm-delete' && recordToDelete ? (
              <DeleteConfirmView
                recordDate={formatDate(recordToDelete.measuredAt)}
                isDeleting={isDeleting}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
              />
            ) : null}
          </div>
        </section>
      </div>

      {/* Fixed Bottom Button - 바로 픽커 호출 */}
      {currentView === 'list' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border/50">
          <Button
            onClick={startScan}
            className="w-full"
            disabled={isButtonDisabled}
          >
            {scanState === 'scanning' ? (
              <>
                <SpinnerGapIcon size={16} className="mr-2 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <PlusIcon size={16} className="mr-2" />
                새 기록 추가
              </>
            )}
          </Button>
        </div>
      )}

      {/* 스캔 결과 미리보기 모달 */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={closePreviewModal}
        title="스캔 결과"
        size="lg"
        closeOnBackdrop={scanState !== 'saving'}
      >
        <ModalBody className="min-h-[300px]">
          {scanState === 'preview' && scanData && (
            <InBodyPreview
              data={scanData}
              imagePreview={scanImagePreview}
              onChange={updateScanData}
            />
          )}

          {scanState === 'saving' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <SpinnerGapIcon size={48} className="text-primary animate-spin" />
              <p className="text-lg font-medium text-card-foreground">
                저장 중...
              </p>
            </div>
          )}

          {scanState === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <WarningCircleIcon size={48} className="text-destructive" />
              <div className="text-center space-y-1">
                <p className="text-lg font-medium text-card-foreground">
                  오류가 발생했습니다
                </p>
                <p className="text-sm text-destructive">{scanError}</p>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          {scanState === 'preview' && (
            <>
              <Button variant="outline" onClick={startScan} className="flex-1">
                다시 스캔
              </Button>
              <Button onClick={saveScanData} className="flex-1">
                <CheckCircleIcon size={16} className="mr-2" />
                저장하기
              </Button>
            </>
          )}

          {scanState === 'error' && (
            <>
              <Button variant="outline" onClick={closePreviewModal} className="flex-1">
                닫기
              </Button>
              <Button onClick={startScan} className="flex-1">
                다시 시도
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>

      {/* Detail Modal */}
      {selectedRecord && (
        <InBodyDetailModal
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          record={selectedRecord}
        />
      )}
    </div>
  );
}
