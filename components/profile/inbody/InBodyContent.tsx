'use client';

import { useState } from 'react';
import { PlusIcon, CameraIcon, PencilSimpleLineIcon } from '@phosphor-icons/react';
import { NextIcon, LoadingSpinner } from '@/components/ui/icons';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import SectionHeader from '@/components/ui/SectionHeader';
import Modal, { ModalBody } from '@/components/ui/Modal';
import { ImageSourceDrawer } from '@/components/drawers';
import {
  InBodyRecordList,
  InBodySummaryCard,
  InBodyDetailModal,
  InBodyScanModal,
  InBodyPreview,
  BodyCompositionSummary,
} from '@/components/inbody';
import { useInBodyManagerSuspense, useCreateInBody } from '@/hooks/inbody';
import { useNativeImagePicker } from '@/hooks/webview';
import { useShowError } from '@/lib/stores/errorStore';
import type { InBodyCreateData } from '@/lib/types/inbody';
import type { ImagePickerSource } from '@/lib/webview';

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

    // Infinite Scroll
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,

    // Selected Record State
    selectedRecord,

    // Detail Modal State
    isDetailModalOpen,

    // Actions
    openDetailModal,
    closeDetailModal,
  } = useInBodyManagerSuspense();

  // 방법 선택 드로어
  const [isMethodOpen, setIsMethodOpen] = useState(false);

  // 스캔 플로우
  const [isImageSourceOpen, setIsImageSourceOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);

  // 직접 입력 플로우
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualData, setManualData] = useState<InBodyCreateData>(() => getManualInitial(records));
  const createInBody = useCreateInBody();
  const showError = useShowError();

  const { pickImage, base64ToFile, isPickerOpen } = useNativeImagePicker();

  // 스캔 선택
  const handleChooseScan = () => {
    setIsMethodOpen(false);
    setIsImageSourceOpen(true);
  };

  // 직접 입력 선택
  const handleChooseManual = () => {
    setIsMethodOpen(false);
    setManualData(getManualInitial(records));
    setIsManualOpen(true);
  };

  const handleSelectSource = async (source: ImagePickerSource) => {
    setIsImageSourceOpen(false);

    const result = await pickImage(source);

    if (result.cancelled || !result.success || !result.base64) return;

    const file = base64ToFile(result.base64, result.fileName || 'inbody.jpg');
    setScanFile(file);
    setScanPreview(result.base64);
    setIsScanModalOpen(true);
  };

  const handleScanModalClose = () => {
    setIsScanModalOpen(false);
    setScanFile(null);
    setScanPreview(null);
  };

  // 직접 입력 저장
  const handleSaveManual = () => {
    if (!manualData.measuredAt || !manualData.weight) {
      showError('측정일과 체중은 필수 항목이에요');
      return;
    }

    createInBody.mutate(manualData, {
      onSuccess: () => {
        setIsManualOpen(false);
        setManualData(getManualInitial(records));
      },
      onError: () => {
        showError('기록 저장에 실패했어요');
      },
    });
  };

  return (
    <>
      <div className="pb-footer-clearance -mx-(--layout-padding-x)">
        <div className="divide-y divide-edge-divider">
          {/* 최근 측정 */}
          <div className="px-(--layout-padding-x) pt-1 pb-5">
            <SectionHeader title="최근 측정" size="md" className="mb-4" />
            <BodyCompositionSummary
              height={summary?.latest?.height}
              measuredAt={summary?.latest?.measuredAt}
              score={summary?.latest?.inbodyScore}
            >
              <InBodySummaryCard
                latest={summary?.latest}
                totalRecords={summary?.totalRecords}
                variant="inline"
              />
            </BodyCompositionSummary>
          </div>

          {/* 측정 기록 헤더 */}
          <div className="px-(--layout-padding-x) pt-5 pb-2">
            <SectionHeader
              title="측정 기록"
              size="md"
              badge={records.length}
            />
          </div>

          {/* 기록 행들 */}
          <InBodyRecordList
            records={records}
            onRecordClick={openDetailModal}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          />
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <GradientFooter variant="page">
        <Button
          onClick={() => setIsMethodOpen(true)}
          className="w-full"
        >
          <PlusIcon size={16} className="mr-2" />
          새 기록 추가
        </Button>
      </GradientFooter>

      {/* 방법 선택 드로어 (스캔/직접입력) */}
      <Modal
        isOpen={isMethodOpen}
        onClose={() => setIsMethodOpen(false)}
        position="bottom"
        enableSwipe
        showCloseButton={false}
      >
        <ModalBody className="p-4 pb-safe">
          <div className="space-y-3">
            <div className="text-center py-1">
              <h3 className="text-base font-semibold text-foreground">새 기록 추가</h3>
              <p className="text-sm text-muted-foreground mt-1">어떻게 기록할까요?</p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleChooseScan}
                className="w-full flex items-center gap-4 p-4 bg-surface-secondary rounded-2xl hover:bg-surface-accent transition-colors text-left"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface-accent text-primary">
                  <CameraIcon size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">결과지 스캔</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    인바디 결과지를 촬영하면 자동으로 추출해요
                  </p>
                </div>
                <NextIcon size="md" className="text-muted-foreground shrink-0" />
              </button>
              <button
                type="button"
                onClick={handleChooseManual}
                className="w-full flex items-center gap-4 p-4 bg-surface-secondary rounded-2xl hover:bg-surface-accent transition-colors text-left"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface-accent text-primary">
                  <PencilSimpleLineIcon size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">직접 입력</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    체중, 골격근량 등을 직접 입력해요
                  </p>
                </div>
                <NextIcon size="md" className="text-muted-foreground shrink-0" />
              </button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      {/* 이미지 소스 선택 드로어 (카메라/갤러리) */}
      <ImageSourceDrawer
        isOpen={isImageSourceOpen}
        onClose={() => setIsImageSourceOpen(false)}
        onSelectCamera={() => handleSelectSource('camera')}
        onSelectGallery={() => handleSelectSource('gallery')}
        isLoading={isPickerOpen}
      />

      {/* 스캔 모달 (이미지 선택 후 바로 SSE 스캔 시작) */}
      <InBodyScanModal
        isOpen={isScanModalOpen}
        onClose={handleScanModalClose}
        initialFile={scanFile ?? undefined}
        initialPreview={scanPreview ?? undefined}
      />

      {/* 직접 입력 모달 */}
      <Modal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        title="직접 입력"
        size="lg"
        closeOnBackdrop={!createInBody.isPending}
        stickyFooter={
          <GradientFooter variant="sheet" className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsManualOpen(false)}
              className="flex-1"
              disabled={createInBody.isPending}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveManual}
              className="flex-1"
              disabled={createInBody.isPending || !manualData.weight}
            >
              {createInBody.isPending ? (
                <>
                  <LoadingSpinner size="sm" variant="current" className="mr-2" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </GradientFooter>
        }
      >
        <ModalBody>
          <div className="px-4 py-2">
            <InBodyPreview
              data={manualData}
              onChange={setManualData}
              initialEditing
            />
          </div>
        </ModalBody>
      </Modal>

      {/* Detail Modal */}
      <InBodyDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        record={selectedRecord!}
      />
    </>
  );
}

function getManualInitial(records: { height?: number }[]): InBodyCreateData {
  const latestHeight = records.length > 0 ? records[0].height : undefined;
  return {
    measuredAt: new Date().toISOString().split('T')[0],
    height: latestHeight,
    weight: 0,
  };
}
