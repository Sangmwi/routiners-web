'use client';

import { useState } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import SectionHeader from '@/components/ui/SectionHeader';
import { ImageSourceDrawer } from '@/components/drawers';
import {
  InBodyRecordList,
  InBodySummaryCard,
  InBodyDetailModal,
  InBodyVisibilitySettings,
  InBodyScanModal,
} from '@/components/inbody';
import { useInBodyManagerSuspense } from '@/hooks/inbody';
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
          onClick={() => setIsImageSourceOpen(true)}
          className="w-full"
        >
          <PlusIcon size={16} className="mr-2" />
          새 기록 추가
        </Button>
      </div>

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
