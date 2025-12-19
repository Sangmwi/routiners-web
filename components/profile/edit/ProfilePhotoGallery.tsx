'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';
import { useProfileImages, UploadingState } from '@/lib/hooks';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import FormSection from '@/components/ui/FormSection';
import { Plus, Loader2, X, GripVertical, Star, Move } from 'lucide-react';

// ============================================================
// Constants
// ============================================================

const MAX_IMAGES = 4;
const MAX_RETRIES = 2;

// ============================================================
// Types
// ============================================================

interface ProfilePhotoGalleryProps {
  user: User;
  onImagesChange?: (images: string[]) => void;
}

interface PhotoSlotProps {
  imageUrl: string | null;
  index: number;
  isFirst: boolean;
  isUploading: boolean;
  isDeleting: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  isLongPressed: boolean;
  isTouchDragging: boolean;
  isMobile: boolean;
  uploadingState: UploadingState | null;
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
  disabled: boolean;
}

// ============================================================
// Sub Components
// ============================================================

/** 대표 사진 배지 */
function MainPhotoBadge() {
  return (
    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
      <Star className="w-3 h-3" />
      대표
    </div>
  );
}

/** 드래그 핸들 (데스크톱) */
function DragHandle() {
  return (
    <div className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
      <GripVertical className="w-4 h-4 text-white" />
    </div>
  );
}

/** 삭제 버튼 */
function DeleteButton({
  isDeleting,
  isVisible,
  onClick,
}: {
  isDeleting: boolean;
  isVisible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDeleting}
      className={`
        absolute bottom-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full
        transition-opacity disabled:opacity-50
        ${isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
      `}
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <X className="w-4 h-4" />
      )}
    </button>
  );
}

/** 업로드 중 오버레이 */
function UploadingOverlay({ state }: { state: UploadingState }) {
  const progressText = {
    compressing: '압축 중...',
    uploading: '업로드 중...',
    retrying: `재시도 중... (${(state.retryCount || 0) + 1}/${MAX_RETRIES})`,
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
        <span className="text-sm text-white mt-2 block">
          {progressText[state.progress]}
        </span>
      </div>
    </div>
  );
}

/** 터치 드래그 인디케이터 */
function TouchDragIndicator() {
  return (
    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
      <Move className="w-8 h-8 text-primary" />
    </div>
  );
}

/** 빈 슬롯 - 추가 버튼 */
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
      className={`
        w-full h-full bg-muted/50 border-2 border-dashed border-border rounded-2xl
        hover:border-primary hover:bg-muted/80 transition-colors
        flex flex-col items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <Plus className="w-8 h-8 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">사진 추가</span>
    </button>
  );
}

/** 사진 슬롯 */
function PhotoSlot({
  imageUrl,
  index,
  isFirst,
  isUploading,
  isDeleting,
  isDragging,
  isDragOver,
  isLongPressed,
  isTouchDragging,
  isMobile,
  uploadingState,
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
  disabled,
}: PhotoSlotProps) {
  const hasImage = !!imageUrl;

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
      draggable={hasImage && !isUploading && !isDeleting && !isMobile}
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
            src={imageUrl}
            alt={`프로필 사진 ${index + 1}`}
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            className="object-cover"
          />

          {isFirst && <MainPhotoBadge />}
          {!isUploading && !isDeleting && <DragHandle />}

          <DeleteButton
            isDeleting={isDeleting}
            isVisible={isLongPressed}
            onClick={onDelete}
          />

          {isUploading && uploadingState && (
            <UploadingOverlay state={uploadingState} />
          )}

          {isTouchDragging && <TouchDragIndicator />}
        </>
      ) : (
        <EmptySlot onClick={onAddClick} disabled={disabled} />
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ProfilePhotoGallery({
  user,
  onImagesChange,
}: ProfilePhotoGalleryProps) {
  // ========== State ==========
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

  // ========== Hooks ==========
  const {
    images,
    uploadingState,
    deletingIndex,
    handleFileSelect,
    handleDelete,
    handleReorder,
    syncImages,
  } = useProfileImages(user.profileImages || [], { onImagesChange });

  // ========== Effects ==========

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // user.profileImages 동기화
  useEffect(() => {
    syncImages(user.profileImages || []);
  }, [user.profileImages, syncImages]);

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
      e.target.value = '';
      await handleFileSelect(file, uploadIndexRef.current);
    },
    [handleFileSelect]
  );

  // Drag & Drop Handlers (Desktop)
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedIndex !== null && draggedIndex !== index) {
        setDragOverIndex(index);
      }
    },
    [draggedIndex]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();

      const fromIndex = draggedIndex;

      // 드래그 상태를 즉시 해제 (API 응답 대기 전)
      setDraggedIndex(null);
      setDragOverIndex(null);

      // 백그라운드에서 순서 변경 실행
      if (fromIndex !== null && fromIndex !== dropIndex) {
        handleReorder(fromIndex, dropIndex);
      }
    },
    [draggedIndex, handleReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Touch Handlers (Mobile)
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

      // 이동 감지시 long press 취소
      if (deltaX > 10 || deltaY > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }

      // 터치 드래그 중 drop 타겟 계산
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

    // 터치 상태를 즉시 해제 (API 응답 대기 전)
    setTouchDragIndex(null);
    setDragOverIndex(null);
    setLongPressIndex(null);

    // 백그라운드에서 순서 변경 실행
    if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      handleReorder(fromIndex, toIndex);
    }
  }, [touchDragIndex, dragOverIndex, handleReorder]);

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
        {slots.map((imageUrl, index) => (
          <PhotoSlot
            key={index}
            imageUrl={imageUrl}
            index={index}
            isFirst={index === 0}
            isUploading={uploadingState?.index === index}
            isDeleting={deletingIndex === index}
            isDragging={draggedIndex === index || touchDragIndex === index}
            isDragOver={dragOverIndex === index}
            isLongPressed={longPressIndex === index}
            isTouchDragging={touchDragIndex === index}
            isMobile={isMobile}
            uploadingState={uploadingState}
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
            disabled={!!uploadingState}
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
    </FormSection>
  );
}
