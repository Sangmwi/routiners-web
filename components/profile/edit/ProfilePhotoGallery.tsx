'use client';

import { useState, useRef, useEffect } from 'react';
import { useProfileImagesDraft, useGridDragDrop } from '@/hooks';
import type { DraftImage, AddImageAsyncResult } from '@/hooks/profile/useProfileImagesDraft';
import { startFileRead, arrayBufferToDataUrl, validateImageFile } from '@/lib/utils/imageValidation';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import FormSection from '@/components/ui/FormSection';
import ErrorToast from '@/components/ui/ErrorToast';
import { Plus, Loader2, X, GripVertical, Star, Move } from 'lucide-react';

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
  isMobile: boolean;
  onAddClick: () => void;
  onDelete: () => void;
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
      <Star className="w-3 h-3" />
      대표
    </div>
  );
}

function DragHandle() {
  return (
    <div className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
      <GripVertical className="w-4 h-4 text-white" />
    </div>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute bottom-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <X className="w-4 h-4" />
    </button>
  );
}

function ProcessingOverlay() {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
    </div>
  );
}

function TouchDragIndicator() {
  return (
    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
      <Move className="w-8 h-8 text-primary" />
    </div>
  );
}

function EmptySlot({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-full bg-muted/50 border-2 border-dashed border-border rounded-2xl hover:border-primary hover:bg-muted/80 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Plus className="w-8 h-8 text-muted-foreground" />
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
  isMobile,
  onAddClick,
  onDelete,
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
    ${isDragging ? 'opacity-60 scale-[0.97] shadow-lg' : ''}
    ${isDragOver ? 'ring-2 ring-primary ring-offset-2 scale-[1.02] bg-primary/5' : ''}
    ${isLongPressed && !isTouchDragging ? 'ring-2 ring-primary/50 ring-offset-2' : ''}
    ${isTouchDragging ? 'opacity-70 scale-[0.97] shadow-xl z-10' : ''}
  `;

  return (
    <div
      className={slotClassName}
      draggable={hasImage && !isProcessing && !isMobile}
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
          {!isProcessing && <DragHandle />}
          {!isProcessing && <DeleteButton onClick={onDelete} />}
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

  // ========== Refs ==========
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIndexRef = useRef<number>(0);

  // ========== Effects ==========

  // Draft 변경 시 부모에게 알림
  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  // ========== Handlers ==========

  const handleAddClick = (index: number) => {
    uploadIndexRef.current = index;
    fileInputRef.current?.click();
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const inputElement = e.target;
    const targetIndex = uploadIndexRef.current;

    // 안드로이드 WebView content:// URI 권한 만료 문제 해결
    // 이벤트 핸들러 내에서 즉시 파일 검증 + 읽기 시작
    const validation = validateImageFile(file);
    if (!validation.valid) {
      inputElement.value = '';
      setErrorMessage(validation.error || '파일 검증에 실패했습니다.');
      return;
    }

    // 파일 읽기 즉시 시작 (비동기지만 읽기 "시작"은 동기적)
    const { promise: readPromise } = startFileRead(file);

    try {
      const arrayBuffer = await readPromise;
      const dataUrl = await arrayBufferToDataUrl(arrayBuffer, file.type || 'image/jpeg');
      const result: AddImageAsyncResult = await addImage(file, targetIndex, dataUrl);

      if (!result.success && result.error) {
        setErrorMessage(result.error);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '파일 처리에 실패했습니다.');
    } finally {
      inputElement.value = '';
    }
  };

  const handleDelete = (index: number) => {
    removeImage(index);
  };

  // ========== Render ==========

  const slots = Array.from({ length: MAX_IMAGES }, (_, i) => images[i] || null);

  return (
    <FormSection
      title="프로필 사진"
      description="최대 4장의 사진을 등록할 수 있습니다."
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      <div ref={gridRef} className="grid grid-cols-2 gap-3">
        {slots.map((image, index) => (
          <PhotoSlot
            key={image?.id || `empty-${index}`}
            image={image}
            index={index}
            isFirst={index === 0 && !!image}
            isProcessing={false}
            isDragging={draggedIndex === index || touchDragIndex === index}
            isDragOver={dragOverIndex === index}
            isLongPressed={longPressIndex === index}
            isTouchDragging={touchDragIndex === index}
            isMobile={isMobile}
            onAddClick={() => handleAddClick(index)}
            onDelete={() => handleDelete(index)}
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
        {isMobile
          ? '꾹 눌러 드래그하여 순서를 변경할 수 있습니다.'
          : '드래그하여 순서를 변경할 수 있습니다.'}
      </p>

      {longPressIndex !== null && (
        <div
          className="fixed inset-0 z-40"
          onClick={resetLongPress}
        />
      )}

      {errorMessage && (
        <ErrorToast
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
    </FormSection>
  );
}
