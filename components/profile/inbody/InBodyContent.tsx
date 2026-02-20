'use client';

import { PlusIcon, WarningCircleIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';
import Button from '@/components/ui/Button';
import SectionHeader from '@/components/ui/SectionHeader';
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal';
import {
  InBodyRecordList,
  InBodySummaryCard,
  InBodyDetailModal,
  InBodyVisibilitySettings,
  InBodyPreview,
} from '@/components/inbody';
import { useInBodyManagerSuspense } from '@/hooks/inbody';

// ============================================================
// Main Content Component
// ============================================================

/**
 * 인바디 관리 콘텐츠 (Suspense 내부)
 *
 * - useSuspenseQuery로 인바디 데이터 조회
 * - 상위 page.tsx의 DetailLayout에서 Header + Suspense 처리
 */
export default function InBodyContent() {
  const {
    // Data (항상 존재 - Suspense가 로딩 처리)
    records,
    summary,

    // Selected Record State
    selectedRecord,

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
  } = useInBodyManagerSuspense();

  // 버튼 비활성화 조건: 스캔 중이거나 저장 중
  const isButtonDisabled = scanState === 'scanning' || scanState === 'saving';

  return (
    <>
      <div className="space-y-6">
        {/* Summary Card */}
        <section className="space-y-3">
          <SectionHeader title="최근 측정" size="sm" />
          <InBodySummaryCard
            latest={summary?.latest}
            totalRecords={summary?.totalRecords}
            variant="card"
          />
        </section>

        {/* Visibility Settings */}
        <section className="space-y-3">
          <SectionHeader title="공개 설정" size="sm" />
          <InBodyVisibilitySettings variant="card" showHeader={false} />
        </section>

        {/* Record List */}
        <section className="space-y-3">
          <SectionHeader
            title="측정 기록"
            size="sm"
            badge={records.length}
          />
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <InBodyRecordList
              records={records}
              onRecordClick={openDetailModal}
            />
          </div>
        </section>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-background border-t border-border/50">
        <Button
          onClick={startScan}
          className="w-full"
          disabled={isButtonDisabled}
        >
          {scanState === 'scanning' ? (
            <>
              <LoadingSpinner size="sm" variant="current" className="mr-2" />
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

      {/* 스캔 결과 미리보기 모달 */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={closePreviewModal}
        title="스캔 결과"
        size="lg"
        position="bottom"
        closeOnBackdrop={scanState !== 'saving'}
      >
        <ModalBody className="p-6 min-h-[300px]">
          {scanState === 'preview' && scanData && (
            <InBodyPreview
              data={scanData}
              imagePreview={scanImagePreview}
              onChange={updateScanData}
            />
          )}

          {scanState === 'saving' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoadingSpinner size="2xl" />
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
                  오류가 발생했어요
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
    </>
  );
}
