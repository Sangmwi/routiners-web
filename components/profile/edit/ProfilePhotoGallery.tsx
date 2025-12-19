'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import FormSection from '@/components/ui/FormSection';
import { Plus, Loader2, X, GripVertical, Star } from 'lucide-react';
import { compressImage, isImageFile, formatFileSize } from '@/lib/utils/imageCompression';

const MAX_IMAGES = 4;

interface ProfilePhotoGalleryProps {
  user: User;
  onImagesChange?: (images: string[]) => void;
}

interface UploadingState {
  index: number;
  progress: 'compressing' | 'uploading';
  previewUrl?: string; // 낙관적 업데이트용 미리보기 URL
}

export default function ProfilePhotoGallery({
  user,
  onImagesChange,
}: ProfilePhotoGalleryProps) {
  const [images, setImages] = useState<string[]>(user.profileImages || []);
  const [uploadingState, setUploadingState] = useState<UploadingState | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [longPressIndex, setLongPressIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIndexRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // Sync with user data when it changes
  useEffect(() => {
    setImages(user.profileImages || []);
  }, [user.profileImages]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    };
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    if (!isImageFile(file)) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    const targetIndex = uploadIndexRef.current;

    // 낙관적 업데이트: 압축 전에 미리보기 생성
    const previewUrl = URL.createObjectURL(file);
    blobUrlsRef.current.add(previewUrl);

    // 즉시 이미지 업데이트 (낙관적)
    const optimisticImages = [...images];
    while (optimisticImages.length <= targetIndex) {
      optimisticImages.push('');
    }
    optimisticImages[targetIndex] = previewUrl;
    const filteredOptimistic = optimisticImages.filter(Boolean);
    setImages(filteredOptimistic);
    onImagesChange?.(filteredOptimistic);

    setUploadingState({ index: targetIndex, progress: 'compressing', previewUrl });

    try {
      // Compress image
      console.log(`압축 전 크기: ${formatFileSize(file.size)}`);
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        quality: 0.8,
      });
      console.log(`압축 후 크기: ${formatFileSize(compressedFile.size)}`);

      setUploadingState({ index: targetIndex, progress: 'uploading', previewUrl });

      // Upload to server
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('index', targetIndex.toString());

      const response = await fetch('/api/user/profile/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      // Cleanup preview URL
      URL.revokeObjectURL(previewUrl);
      blobUrlsRef.current.delete(previewUrl);

      // Update with server response
      setImages(data.profileImages);
      onImagesChange?.(data.profileImages);
    } catch (error) {
      console.error('Failed to upload photo:', error);

      // Rollback: 이전 상태로 복원
      URL.revokeObjectURL(previewUrl);
      blobUrlsRef.current.delete(previewUrl);
      setImages(user.profileImages || []);
      onImagesChange?.(user.profileImages || []);

      alert('사진 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploadingState(null);
    }
  }, [images, user.profileImages, onImagesChange]);

  const handleAddClick = useCallback((index: number) => {
    uploadIndexRef.current = index;
    fileInputRef.current?.click();
  }, []);

  const handleDelete = useCallback(async (index: number) => {
    const imageUrl = images[index];
    if (!imageUrl) return;

    // Confirm deletion
    if (!confirm('이 사진을 삭제하시겠습니까?')) return;

    // 낙관적 업데이트: 즉시 삭제
    const optimisticImages = images.filter((_, i) => i !== index);
    setImages(optimisticImages);
    onImagesChange?.(optimisticImages);
    setDeletingIndex(index);

    try {
      const response = await fetch('/api/user/profile/image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      const data = await response.json();

      // Update with server response
      setImages(data.profileImages);
      onImagesChange?.(data.profileImages);
    } catch (error) {
      console.error('Failed to delete photo:', error);

      // Rollback: 이전 상태로 복원
      setImages(user.profileImages || []);
      onImagesChange?.(user.profileImages || []);

      alert('사진 삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDeletingIndex(null);
      setLongPressIndex(null);
    }
  }, [images, user.profileImages, onImagesChange]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    // Reorder images locally
    const newImages = [...images];
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, removed);

    // Optimistic update
    setImages(newImages);
    setDraggedIndex(null);

    try {
      // Save new order to server
      const response = await fetch('/api/user/profile/image', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImages: newImages }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Reorder failed');
      }

      const data = await response.json();
      setImages(data.profileImages);
      onImagesChange?.(data.profileImages);
    } catch (error) {
      console.error('Failed to reorder photos:', error);
      // Revert on error
      setImages(user.profileImages || []);
      alert('순서 변경에 실패했습니다.');
    }
  }, [draggedIndex, images, user.profileImages, onImagesChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Long press handlers for mobile delete
  const handleTouchStart = useCallback((index: number) => {
    longPressTimerRef.current = setTimeout(() => {
      setLongPressIndex(index);
      // Haptic feedback via vibration API
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchCancel = useCallback(() => {
    handleTouchEnd();
    setLongPressIndex(null);
  }, [handleTouchEnd]);

  // Create slots array (existing images + empty slots up to MAX_IMAGES)
  const slots = Array.from({ length: MAX_IMAGES }, (_, i) => images[i] || null);

  return (
    <FormSection
      title="프로필 사진"
      description="최대 4장의 사진을 등록할 수 있습니다. 첫 번째 사진이 대표 사진이 됩니다."
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo grid - 2x2 grid layout */}
      <div className="grid grid-cols-2 gap-3">
        {slots.map((imageUrl, index) => {
          const isUploading = uploadingState?.index === index;
          const isDeleting = deletingIndex === index;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;
          const isLongPressed = longPressIndex === index;
          const hasImage = !!imageUrl;
          const isFirst = index === 0;

          return (
            <div
              key={index}
              className={`
                group relative aspect-[2/3] rounded-2xl overflow-hidden
                transition-all duration-200
                ${isDragging ? 'opacity-50 scale-95' : ''}
                ${isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''}
                ${isLongPressed ? 'ring-2 ring-destructive ring-offset-2' : ''}
              `}
              draggable={hasImage && !isUploading && !isDeleting}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={() => hasImage && handleTouchStart(index)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
            >
              {hasImage ? (
                <>
                  {/* Image */}
                  <ImageWithFallback
                    src={imageUrl}
                    alt={`프로필 사진 ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 200px"
                    className="object-cover"
                  />

                  {/* First image badge */}
                  {isFirst && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      대표
                    </div>
                  )}

                  {/* Drag handle (desktop) */}
                  {!isUploading && !isDeleting && (
                    <div className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                      <GripVertical className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    disabled={isDeleting}
                    className={`
                      absolute bottom-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full
                      transition-opacity
                      ${isLongPressed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                      disabled:opacity-50
                    `}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>

                  {/* Loading overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
                        <span className="text-sm text-white mt-2 block">
                          {uploadingState.progress === 'compressing' && '압축 중...'}
                          {uploadingState.progress === 'uploading' && '업로드 중...'}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Empty slot - add button */
                <button
                  type="button"
                  onClick={() => handleAddClick(index)}
                  disabled={!!uploadingState}
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
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        드래그하여 순서를 변경할 수 있습니다. 모바일에서는 길게 눌러 삭제하세요.
      </p>

      {/* Dismiss long press mode */}
      {longPressIndex !== null && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setLongPressIndex(null)}
        />
      )}
    </FormSection>
  );
}
