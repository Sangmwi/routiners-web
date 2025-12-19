'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import FormSection from '@/components/ui/FormSection';
import { Plus, Loader2, X, GripVertical, Star, Move } from 'lucide-react';
import { compressImage, isImageFile, formatFileSize } from '@/lib/utils/imageCompression';

const MAX_IMAGES = 4;
const UPLOAD_TIMEOUT = 30000; // 30초 타임아웃
const MAX_RETRIES = 2;

interface ProfilePhotoGalleryProps {
  user: User;
  onImagesChange?: (images: string[]) => void;
}

interface UploadingState {
  index: number;
  progress: 'compressing' | 'uploading' | 'retrying';
  previewUrl?: string; // 낙관적 업데이트용 미리보기 URL
  retryCount?: number;
}

// 타임아웃이 있는 fetch 함수
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = UPLOAD_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw error;
  }
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
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIndexRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Sync with user data when it changes
  useEffect(() => {
    setImages(user.profileImages || []);
  }, [user.profileImages]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    setUploadingState({ index: targetIndex, progress: 'compressing', previewUrl, retryCount: 0 });

    try {
      // Compress image
      console.log(`압축 전 크기: ${formatFileSize(file.size)}`);
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        quality: 0.8,
      });
      console.log(`압축 후 크기: ${formatFileSize(compressedFile.size)}`);

      // 재시도 로직이 포함된 업로드 함수
      const uploadWithRetry = async (retryCount: number = 0): Promise<Response> => {
        setUploadingState({
          index: targetIndex,
          progress: retryCount > 0 ? 'retrying' : 'uploading',
          previewUrl,
          retryCount,
        });

        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('index', targetIndex.toString());

        try {
          const response = await fetchWithTimeout('/api/user/profile/image', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          return response;
        } catch (error) {
          const isTimeout = error instanceof Error && error.message === 'TIMEOUT';
          const isNetworkError = error instanceof TypeError;

          // 타임아웃이나 네트워크 오류면 재시도
          if ((isTimeout || isNetworkError) && retryCount < MAX_RETRIES) {
            console.log(`업로드 재시도 중... (${retryCount + 1}/${MAX_RETRIES})`);
            // 재시도 전 잠시 대기 (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return uploadWithRetry(retryCount + 1);
          }

          throw error;
        }
      };

      const response = await uploadWithRetry();
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

      // 에러 메시지 개선
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'TIMEOUT') {
        alert('업로드 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.');
      } else if (error instanceof TypeError) {
        alert('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.');
      } else {
        alert('사진 업로드에 실패했습니다. 다시 시도해주세요.');
      }
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
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    longPressTimerRef.current = setTimeout(() => {
      setLongPressIndex(index);
      setTouchDragIndex(index);
      // Haptic feedback via vibration API
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // 이동이 감지되면 long press 취소
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    // 터치 드래그 중이면 drop 타겟 계산
    if (touchDragIndex !== null && gridRef.current) {
      const gridItems = gridRef.current.children;

      // 각 그리드 아이템의 위치 확인
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
          }
          break;
        } else {
          setDragOverIndex(null);
        }
      }
    }
  }, [touchDragIndex, images]);

  const handleTouchEnd = useCallback(async () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartRef.current = null;

    // 터치 드래그로 순서 변경
    if (touchDragIndex !== null && dragOverIndex !== null && touchDragIndex !== dragOverIndex) {
      const newImages = [...images];
      const [removed] = newImages.splice(touchDragIndex, 1);
      newImages.splice(dragOverIndex, 0, removed);

      // Optimistic update
      setImages(newImages);

      try {
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
        setImages(user.profileImages || []);
        alert('순서 변경에 실패했습니다.');
      }
    }

    setTouchDragIndex(null);
    setDragOverIndex(null);
    setLongPressIndex(null);
  }, [touchDragIndex, dragOverIndex, images, user.profileImages, onImagesChange]);

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
      <div ref={gridRef} className="grid grid-cols-2 gap-3">
        {slots.map((imageUrl, index) => {
          const isUploading = uploadingState?.index === index;
          const isDeleting = deletingIndex === index;
          const isDragging = draggedIndex === index || touchDragIndex === index;
          const isDragOver = dragOverIndex === index;
          const isLongPressed = longPressIndex === index;
          const isTouchDragging = touchDragIndex === index;
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
                ${isLongPressed && !isTouchDragging ? 'ring-2 ring-destructive ring-offset-2' : ''}
                ${isTouchDragging ? 'ring-2 ring-primary ring-offset-2 z-10' : ''}
              `}
              draggable={hasImage && !isUploading && !isDeleting && !isMobile}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => hasImage && handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
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
                          {uploadingState.progress === 'retrying' && `재시도 중... (${(uploadingState.retryCount || 0) + 1}/${MAX_RETRIES})`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mobile drag indicator */}
                  {isTouchDragging && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Move className="w-8 h-8 text-primary" />
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
        {isMobile
          ? '길게 누른 후 드래그하여 순서를 변경하세요.'
          : '드래그하여 순서를 변경할 수 있습니다.'
        }
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
