'use client';

import { useState } from 'react';
import { PlusIcon, CameraIcon, PencilSimpleLineIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import SectionHeader from '@/components/ui/SectionHeader';
import Modal, { ModalBody } from '@/components/ui/Modal';
import OptionSheet, { type OptionItem } from '@/components/ui/OptionSheet';
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
import { isApiError } from '@/lib/types';
import type { InBodyCreateData } from '@/lib/types/inbody';
import { InBodyFormSchema, InBodyFormErrors } from '@/lib/types/inbody';
import { validateForm } from '@/lib/utils/formValidation';
import type { ImagePickerSource } from '@/lib/webview';

// ============================================================
// Constants
// ============================================================

type InBodyAddOption = 'scan' | 'manual';

const INBODY_ADD_OPTIONS: OptionItem<InBodyAddOption>[] = [
  {
    value: 'scan',
    title: '결과지 스캔',
    description: '인바디 결과지를 촬영하면 자동으로 추출해요',
    icon: <CameraIcon size={24} />,
  },
  {
    value: 'manual',
    title: '직접 입력',
    description: '체중, 골격근량 등을 직접 입력해요',
    icon: <PencilSimpleLineIcon size={24} />,
  },
];

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
  const [manualFormErrors, setManualFormErrors] = useState<InBodyFormErrors>({});
  const createInBody = useCreateInBody();
  const showError = useShowError();

  const { pickImage, base64ToFile, isPickerOpen } = useNativeImagePicker();

  const handleMethodSelect = (option: 'scan' | 'manual') => {
    setIsMethodOpen(false);
    if (option === 'scan') {
      setIsImageSourceOpen(true);
    } else {
      setManualData(getManualInitial(records));
      setManualFormErrors({});
      setIsManualOpen(true);
    }
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
    if (!validateForm<keyof InBodyFormErrors>(InBodyFormSchema, {
      measuredAt: manualData.measuredAt,
      weight: manualData.weight,
      height: manualData.height,
      skeletalMuscleMass: manualData.skeletalMuscleMass,
      bodyFatPercentage: manualData.bodyFatPercentage,
    }, setManualFormErrors)) return;

    createInBody.mutate(manualData, {
      onSuccess: () => {
        setIsManualOpen(false);
        setManualData(getManualInitial(records));
      },
      onError: (err) => {
        if (isApiError(err) && err.code === 'CONFLICT') {
          setManualFormErrors({ measuredAt: '이 날짜에 이미 기록이 있어요' });
        } else {
          showError('기록 저장에 실패했어요');
        }
      },
    });
  };

  return (
    <>
      <div className="pb-footer-clearance -mx-(--layout-padding-x)">
        <div className="divide-y divide-edge-divider">
          {/* 최근 측정 */}
          <div className="px-(--layout-padding-x) pt-3 pb-7">
            <SectionHeader title="최근 측정" size="md" className="mb-5" />
            <BodyCompositionSummary
              height={summary?.latest?.height}
              measuredAt={summary?.latest?.measuredAt}
              score={summary?.latest?.inbodyScore}
              periodDays={summary?.changes?.periodDays}
            >
              <InBodySummaryCard
                latest={summary?.latest}
                totalRecords={summary?.totalRecords}
                changes={summary?.changes}
                showDeltaIcons
                variant="inline"
              />
            </BodyCompositionSummary>
          </div>

          {/* 측정 기록 헤더 */}
          <div className="px-(--layout-padding-x) pt-5 pb-3">
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
      <GradientFooter variant="page" wrapperClassName="animate-float-up">
        <Button
          size="lg"
          onClick={() => setIsMethodOpen(true)}
          className="w-full"
        >
          <PlusIcon size={16} className="mr-2" />
          새 기록 추가
        </Button>
      </GradientFooter>

      {/* 방법 선택 드로어 (스캔/직접입력) */}
      <OptionSheet
        variant="card"
        isOpen={isMethodOpen}
        onClose={() => setIsMethodOpen(false)}
        title="새 기록 추가"
        description="어떻게 기록할까요?"
        options={INBODY_ADD_OPTIONS}
        onSelect={handleMethodSelect}
      />

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
        onClose={() => { setIsManualOpen(false); setManualFormErrors({}); }}
        title="직접 입력"
        position="bottom"
        height="auto"
        closeOnBackdrop={!createInBody.isPending}
        preventClose={createInBody.isPending}
        stickyFooter={
          <GradientFooter variant="sheet">
            <Button
              onClick={handleSaveManual}
              fullWidth
              disabled={!manualData.weight}
              isLoading={createInBody.isPending}
            >
              저장
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
              fieldErrors={manualFormErrors}
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

function getManualInitial(records: { height?: number; weight?: number }[]): InBodyCreateData {
  const latestHeight = records.length > 0 ? records[0].height : undefined;
  const latestWeight = records.length > 0 ? records[0].weight : undefined;
  return {
    measuredAt: new Date().toISOString().split('T')[0],
    height: latestHeight,
    weight: latestWeight,
  };
}
