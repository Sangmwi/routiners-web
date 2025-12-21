'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useProfileImagesDraft, DraftImage, AddImageAsyncResult } from '@/lib/hooks';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import FormSection from '@/components/ui/FormSection';
import { Plus, Loader2, X, GripVertical, Star, Move, AlertCircle } from 'lucide-react';

// ============================================================
// Constants
// ============================================================

const MAX_IMAGES = 4;

// ============================================================
// Types
// ============================================================

export interface ProfilePhotoGalleryProps {
  initialImages: string[];
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

function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm flex-1">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 hover:opacity-80"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
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
  onDraftChange,
}: ProfilePhotoGalleryProps) {
  // ========== Draft Hook ==========
  const draft = useProfileImagesDraft(initialImages);
  const { images, addImage, removeImage, reorderImages } = draft;

  // ========== Toast State ==========
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ========== Drag State ==========
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [longPressIndex, setLongPressIndex] = useState<number | null>(null);
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // ========== Refs ==========
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIndexRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ========== Effects ==========

  // Draft 변경 시 부모에게 알림
  useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 터치 드래그 중 스크롤 방지
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const preventScroll = (e: TouchEvent) => {
      if (touchDragIndex !== null) {
        e.preventDefault();
      }
    };

    grid.addEventListener('touchmove', preventScroll, { passive: false });
    return () => grid.removeEventListener('touchmove', preventScroll);
  }, [touchDragIndex]);

  // ========== Handlers ==========

  const handleAddClick = useCallback((index: number) => {
    uploadIndexRef.current = index;
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 🔥 중요: input 초기화를 파일 읽기 완료 후로 지연
      // e.target.value = '' 를 먼저 하면 일부 WebView에서
      // 파일 참조가 무효화되어 FileReader가 실패할 수 있음
      const inputElement = e.target;

      // 비동기 함수 (Data URL 변환)
      const result: AddImageAsyncResult = await addImage(file, uploadIndexRef.current);

      // 파일 읽기 완료 후 input 초기화 (같은 파일 재선택 허용)
      inputElement.value = '';

      if (!result.success && result.error) {
        setErrorMessage(result.error);
      }
    },
    [addImage]
  );

  const handleDelete = useCallback(
    (index: number) => {
      removeImage(index);
    },
    [removeImage]
  );

  // Desktop Drag & Drop
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedIndex !== null && draggedIndex !== index && images[index]) {
        setDragOverIndex(index);
      }
    },
    [draggedIndex, images]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const fromIndex = draggedIndex;
      setDraggedIndex(null);
      setDragOverIndex(null);

      if (fromIndex !== null && fromIndex !== dropIndex && images[dropIndex]) {
        reorderImages(fromIndex, dropIndex);
      }
    },
    [draggedIndex, images, reorderImages]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Mobile Touch
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      setLongPressIndex(index);
      setTouchDragIndex(index);
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      if (deltaX > 10 || deltaY > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }

      if (touchDragIndex !== null && gridRef.current) {
        const gridItems = gridRef.current.children;
        let foundTarget = false;

        for (let i = 0; i < gridItems.length; i++) {
          const item = gridItems[i] as HTMLElement;
          const rect = item.getBoundingClientRect();

          if (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
          ) {
            if (i !== touchDragIndex && images[i]) {
              setDragOverIndex(i);
            } else {
              setDragOverIndex(null);
            }
            foundTarget = true;
            break;
          }
        }

        if (!foundTarget) {
          setDragOverIndex(null);
        }
      }
    },
    [touchDragIndex, images]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartRef.current = null;

    const fromIndex = touchDragIndex;
    const toIndex = dragOverIndex;

    setTouchDragIndex(null);
    setDragOverIndex(null);
    setLongPressIndex(null);

    if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      reorderImages(fromIndex, toIndex);
    }
  }, [touchDragIndex, dragOverIndex, reorderImages]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartRef.current = null;
    setTouchDragIndex(null);
    setDragOverIndex(null);
    setLongPressIndex(null);
  }, []);

  // ========== Render ==========

  const slots = Array.from({ length: MAX_IMAGES }, (_, i) => images[i] || null);

  return (
    <FormSection
      title="프로필 사진"
      description="최대 4장의 사진을 등록할 수 있습니다. 첫 번째 사진이 대표 사진이 됩니다."
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
          ? '길게 누른 후 드래그하여 순서를 변경하세요.'
          : '드래그하여 순서를 변경할 수 있습니다.'}
      </p>

      {longPressIndex !== null && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setLongPressIndex(null)}
        />
      )}

      {/* Error Toast */}
      {errorMessage && (
        <ErrorToast
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
    </FormSection>
  );
}
