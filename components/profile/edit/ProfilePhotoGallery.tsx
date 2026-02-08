"use client";

import { useState, useEffect } from "react";
import { useProfileImagesDraft, useGridDragDrop } from "@/hooks";
import { useNativeImagePicker } from "@/hooks/webview";
import type {
  DraftImage,
  AddImageResult,
} from "@/hooks/profile/useProfileImagesDraft";
import type { ImagePickerSource } from "@/lib/webview";
import { validateImageFile } from "@/lib/utils/imageValidation";
import { ImageWithFallback } from "@/components/ui/image";
import { ImageSourceDrawer } from "@/components/drawers";
import FormSection from "@/components/ui/FormSection";
import ErrorToast from "@/components/ui/ErrorToast";
import { PlusIcon, SpinnerGapIcon, XIcon, StarIcon, ArrowsOutCardinalIcon } from "@phosphor-icons/react";

// ============================================================
// Constants
// ============================================================

const MAX_IMAGES = 4;

// ============================================================
// Types
// ============================================================

export interface ProfilePhotoGalleryProps {
  initialImages: string[];
  isSaving?: boolean;
  onDraftChange?: (draft: ReturnType<typeof useProfileImagesDraft>) => void;
}

interface PhotoSlotProps {
  image: DraftImage | null;
  index: number;
  isFirst: boolean;
  isProcessing: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  isLongPressed: boolean;
  isTouchDragging: boolean;
  isSelected: boolean;
  isMobile: boolean;
  onAddClick: () => void;
  onDelete: () => void;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
}

// ============================================================
// Sub Components
// ============================================================

function MainPhotoBadge() {
  return (
    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
      <StarIcon size={12} weight="fill" />
      대표
    </div>
  );
}

function DeleteOverlay({
  isVisible,
  onDelete,
}: {
  isVisible: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      className={`absolute inset-0 bg-black/60 transition-opacity pointer-events-none ${
        isVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={`absolute top-2 right-2 p-1 ${
          isVisible
            ? "pointer-events-auto"
            : "pointer-events-none group-hover:pointer-events-auto"
        }`}
      >
        <XIcon size={20} className="text-white/80" />
      </button>
    </div>
  );
}

function ProcessingOverlay() {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
      <SpinnerGapIcon size={32} className="text-white animate-spin" />
    </div>
  );
}

function TouchDragIndicator() {
  return (
    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
      <ArrowsOutCardinalIcon size={32} className="text-primary" />
    </div>
  );
}

function EmptySlot({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-full bg-muted/50 border-2 border-dashed border-border rounded-2xl hover:border-primary hover:bg-muted/80 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <PlusIcon size={32} className="text-muted-foreground" />
      <span className="text-sm text-muted-foreground">사진 추가</span>
    </button>
  );
}

function PhotoSlot({
  image,
  index,
  isFirst,
  isProcessing,
  isDragging,
  isDragOver,
  isLongPressed,
  isTouchDragging,
  isSelected,
  isMobile,
  onAddClick,
  onDelete,
  onSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
}: PhotoSlotProps) {
  const hasImage = !!image;

  const slotClassName = `
    group relative aspect-[2/3] rounded-2xl overflow-hidden
    transition-[transform,opacity,box-shadow] duration-150 ease-out
    ${isDragging ? "opacity-60 scale-[0.97] shadow-lg" : ""}
    ${isDragOver ? "ring-2 ring-primary ring-offset-2 scale-[1.02] bg-primary/5" : ""}
    ${isLongPressed && !isTouchDragging ? "ring-2 ring-primary/50 ring-offset-2" : ""}
    ${isTouchDragging ? "opacity-70 scale-[0.97] shadow-xl z-10" : ""}
  `;

  const handleClick = () => {
    if (hasImage && !isProcessing && !isTouchDragging) {
      onSelect();
    }
  };

  return (
    <div
      className={slotClassName}
      draggable={hasImage && !isProcessing && !isMobile}
      onClick={handleClick}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onTouchStart={hasImage ? onTouchStart : undefined}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      {hasImage ? (
        <>
          <ImageWithFallback
            src={image.displayUrl}
            alt={`프로필 사진 ${index + 1}`}
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            className="object-cover"
            optimizePreset="card"
          />
          {isFirst && <MainPhotoBadge />}
          {!isProcessing && (
            <DeleteOverlay isVisible={isSelected} onDelete={onDelete} />
          )}
          {isProcessing && <ProcessingOverlay />}
          {isTouchDragging && <TouchDragIndicator />}
        </>
      ) : (
        <EmptySlot onClick={onAddClick} disabled={isProcessing} />
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ProfilePhotoGallery({
  initialImages,
  isSaving = false,
  onDraftChange,
}: ProfilePhotoGalleryProps) {
  // ========== Draft Hook ==========
  const draft = useProfileImagesDraft(initialImages, { isSaving });
  const { images, addImage, removeImage, reorderImages } = draft;

  // ========== Drag & Drop Hook ==========
  const {
    draggedIndex,
    dragOverIndex,
    longPressIndex,
    touchDragIndex,
    isMobile,
    gridRef,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    resetLongPress,
  } = useGridDragDrop({
    items: images,
    onReorder: reorderImages,
    canDrag: (index) => !!images[index],
    canDrop: (index) => !!images[index],
  });

  // ========== Toast State ==========
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ========== Native Image Picker ==========
  const { pickImage, base64ToFile } = useNativeImagePicker();

  // ========== Refs & State ==========
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const [isImageSourceOpen, setIsImageSourceOpen] = useState(false);
  const [pendingSlotIndex, setPendingSlotIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // ========== Effects ==========

  // Draft 변경 시 부모에게 알림
  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  // ========== Handlers ==========

  // 빈 슬롯 클릭 - 이미지 소스 선택 드로어 열기
  const handleAddClick = (index: number) => {
    setPendingSlotIndex(index);
    setIsImageSourceOpen(true);
  };

  // 이미지 소스 선택 후 처리
  const handleSelectSource = async (source: ImagePickerSource) => {
    if (pendingSlotIndex === null) return;

    setIsImageSourceOpen(false);
    setProcessingIndex(pendingSlotIndex);

    const result = await pickImage(source);

    if (result.cancelled) {
      setProcessingIndex(null);
      setPendingSlotIndex(null);
      return;
    }

    if (!result.success) {
      setErrorMessage(result.error || "이미지 선택에 실패했어요.");
      setProcessingIndex(null);
      setPendingSlotIndex(null);
      return;
    }

    if (result.base64) {
      const file = base64ToFile(
        result.base64,
        result.fileName || "profile.jpg"
      );

      // 파일 검증
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || "파일 검증에 실패했어요.");
        setProcessingIndex(null);
        setPendingSlotIndex(null);
        return;
      }

      // 동기적으로 이미지 추가 (Blob URL 즉시 생성)
      const addResult: AddImageResult = addImage(file, pendingSlotIndex);

      if (!addResult.success && addResult.error) {
        setErrorMessage(addResult.error);
      }
    }

    setProcessingIndex(null);
    setPendingSlotIndex(null);
  };

  const handleDelete = (index: number) => {
    removeImage(index);
    setSelectedIndex(null);
  };

  const handleSelect = (index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  };

  const clearSelection = () => {
    setSelectedIndex(null);
  };

  // ========== Render ==========

  const slots = Array.from({ length: MAX_IMAGES }, (_, i) => images[i] || null);

  return (
    <FormSection
      title="프로필 사진"
      description="최대 4장의 사진을 등록할 수 있어요."
    >
      <div ref={gridRef} className="grid grid-cols-2 gap-3">
        {slots.map((image, index) => (
          <PhotoSlot
            key={image?.id || `empty-${index}`}
            image={image}
            index={index}
            isFirst={index === 0 && !!image}
            isProcessing={processingIndex === index}
            isDragging={draggedIndex === index || touchDragIndex === index}
            isDragOver={dragOverIndex === index}
            isLongPressed={longPressIndex === index}
            isTouchDragging={touchDragIndex === index}
            isSelected={selectedIndex === index}
            isMobile={isMobile}
            onAddClick={() => handleAddClick(index)}
            onDelete={() => handleDelete(index)}
            onSelect={() => handleSelect(index)}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, index)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        드래그하여 순서를 변경할 수 있어요.
      </p>

      {longPressIndex !== null && (
        <div className="fixed inset-0 z-40" onClick={resetLongPress} />
      )}

      {selectedIndex !== null && (
        <div className="fixed inset-0 z-40" onClick={clearSelection} />
      )}

      {errorMessage && (
        <ErrorToast
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      {/* 이미지 소스 선택 드로어 */}
      <ImageSourceDrawer
        isOpen={isImageSourceOpen}
        onClose={() => {
          setIsImageSourceOpen(false);
          setPendingSlotIndex(null);
        }}
        onSelectCamera={() => handleSelectSource("camera")}
        onSelectGallery={() => handleSelectSource("gallery")}
        isLoading={processingIndex !== null}
      />
    </FormSection>
  );
}
