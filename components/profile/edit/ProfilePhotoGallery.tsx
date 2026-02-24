"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useProfileImagesDraft } from "@/hooks";
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
import { PlusIcon, XIcon, StarIcon } from "@phosphor-icons/react";
import { LoadingSpinner } from "@/components/ui/icons";

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
  image: DraftImage;
  index: number;
  isFirst: boolean;
  isProcessing: boolean;
  isDragging: boolean;
  isSelected: boolean;
  onDelete: () => void;
  onSelect: () => void;
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
      <LoadingSpinner size="xl" variant="current" className="text-white" />
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
    <div className="aspect-[2/3]">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full h-full bg-surface-muted border-2 border-dashed border-border rounded-2xl hover:border-primary hover:bg-surface-pressed transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PlusIcon size={32} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">사진 추가</span>
      </button>
    </div>
  );
}

function PhotoSlot({
  image,
  index,
  isFirst,
  isProcessing,
  isDragging,
  isSelected,
  onDelete,
  onSelect,
}: PhotoSlotProps) {
  const handleClick = () => {
    if (!isProcessing) {
      onSelect();
    }
  };

  return (
    <div
      className={`
        group relative aspect-[2/3] rounded-2xl overflow-hidden
        transition-[transform,opacity,box-shadow] duration-150 ease-out
        ${isDragging ? "opacity-60 scale-[0.97] shadow-lg z-10" : ""}
      `}
      onClick={handleClick}
    >
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
    </div>
  );
}

// ============================================================
// Sortable Wrapper
// ============================================================

function SortablePhotoSlot({
  image,
  index,
  isFirst,
  isProcessing,
  isSelected,
  onDelete,
  onSelect,
}: Omit<PhotoSlotProps, "isDragging">) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id, disabled: isProcessing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PhotoSlot
        image={image}
        index={index}
        isFirst={isFirst}
        isProcessing={isProcessing}
        isDragging={isDragging}
        isSelected={isSelected}
        onDelete={onDelete}
        onSelect={onSelect}
      />
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

  // ========== DnD Sensors ==========
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 500, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderImages(oldIndex, newIndex);
  };

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

  const emptySlotCount = MAX_IMAGES - images.length;

  return (
    <FormSection
      title="프로필 사진"
      description="최대 4장의 사진을 등록할 수 있어요."
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((img) => img.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-3">
            {images.map((image, index) => (
              <SortablePhotoSlot
                key={image.id}
                image={image}
                index={index}
                isFirst={index === 0}
                isProcessing={processingIndex === index}
                isSelected={selectedIndex === index}
                onDelete={() => handleDelete(index)}
                onSelect={() => handleSelect(index)}
              />
            ))}
            {Array.from({ length: emptySlotCount }, (_, i) => (
              <EmptySlot
                key={`empty-${i}`}
                onClick={() => handleAddClick(images.length + i)}
                disabled={processingIndex !== null}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        드래그하여 순서를 변경할 수 있어요.
      </p>

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
