'use client';

import { useState } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import SectionHeader from '@/components/ui/SectionHeader';
import { ImageSourceDrawer } from '@/components/drawers';
import {
  InBodyRecordList,
  InBodySummaryCard,
  InBodyDetailModal,
  InBodyScanModal,
  BodyCompositionSummary,
} from '@/components/inbody';
import { useInBodyManagerSuspense } from '@/hooks/inbody';
import { useCurrentUserProfileSuspense } from '@/hooks/profile';
import { useNativeImagePicker } from '@/hooks/webview';
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

    // Selected Record State
    selectedRecord,

    // Detail Modal State
    isDetailModalOpen,

    // Actions
    openDetailModal,
    closeDetailModal,
  } = useInBodyManagerSuspense();

  const { data: user } = useCurrentUserProfileSuspense();

  // 이미지 선택 → 스캔 모달 플로우
  const [isImageSourceOpen, setIsImageSourceOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);

  const { pickImage, base64ToFile, isPickerOpen } = useNativeImagePicker();

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

  return (
    <>
      <div className="pb-footer-clearance -mx-(--layout-padding-x)">
        <div className="divide-y divide-edge-divider">
          {/* 최근 측정 */}
          <div className="px-(--layout-padding-x) pt-1 pb-5">
            <SectionHeader title="최근 측정" size="md" className="mb-4" />
            <BodyCompositionSummary
              height={user.height}
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
          />
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <GradientFooter variant="page">
        <Button
          onClick={() => setIsImageSourceOpen(true)}
          className="w-full"
        >
          <PlusIcon size={16} className="mr-2" />
          새 기록 추가
        </Button>
      </GradientFooter>

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

      {/* Detail Modal */}
      <InBodyDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        record={selectedRecord!}
      />
    </>
  );
}
