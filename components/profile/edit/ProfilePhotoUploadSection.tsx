'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import FormSection from '@/components/ui/FormSection';
import { Plus, X, AlertCircle } from 'lucide-react';
import { validateImageFile } from '@/lib/utils/imageValidation';

// ============================================================
// Types
// ============================================================

interface ProfilePhotoUploadSectionProps {
  user: User;
  onMainPhotoChange?: (file: File | null) => void;
  onAdditionalPhotosChange?: (index: number, file: File | null) => void;
}

// ============================================================
// Sub Components
// ============================================================

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

// ============================================================
// Main Component
// ============================================================

export default function ProfilePhotoUploadSection({
  user,
  onMainPhotoChange,
  onAdditionalPhotosChange,
}: ProfilePhotoUploadSectionProps) {
  // ========== State ==========
  const [mainPhoto, setMainPhoto] = useState(user.profileImages?.[0]);
  const [additionalPhotos, setAdditionalPhotos] = useState<(string | null)[]>([null, null, null]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ========== Refs ==========
  const mainPhotoInputRef = useRef<HTMLInputElement>(null);
  const additionalPhotoInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // ========== Effects ==========

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    };
  }, []);

  // ========== Handlers ==========

  const handleMainPhotoUpload = useCallback(() => {
    mainPhotoInputRef.current?.click();
  }, []);

  const handleAdditionalPhotoUpload = useCallback((index: number) => {
    additionalPhotoInputRefs.current[index]?.click();
  }, []);

  const handleMainPhotoFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = ''; // Reset input

      // 동기 검증 (압축 없음)
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || '이미지 검증에 실패했습니다.');
        return;
      }

      // Create local preview URL
      const previewUrl = URL.createObjectURL(file);

      // Clean up old blob URL if exists
      if (mainPhoto && mainPhoto.startsWith('blob:')) {
        URL.revokeObjectURL(mainPhoto);
        blobUrlsRef.current.delete(mainPhoto);
      }

      // Store new blob URL for cleanup
      blobUrlsRef.current.add(previewUrl);

      // Update UI with preview
      setMainPhoto(previewUrl);

      // Notify parent component with original file (no compression)
      onMainPhotoChange?.(file);
    },
    [mainPhoto, onMainPhotoChange]
  );

  const handleAdditionalPhotoFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = ''; // Reset input

      // 동기 검증 (압축 없음)
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || '이미지 검증에 실패했습니다.');
        return;
      }

      // Create local preview URL
      const previewUrl = URL.createObjectURL(file);

      // Clean up old blob URL if exists
      const oldPhoto = additionalPhotos[index];
      if (oldPhoto && oldPhoto.startsWith('blob:')) {
        URL.revokeObjectURL(oldPhoto);
        blobUrlsRef.current.delete(oldPhoto);
      }

      // Store new blob URL for cleanup
      blobUrlsRef.current.add(previewUrl);

      // Update UI with preview
      setAdditionalPhotos((prev) => {
        const newPhotos = [...prev];
        newPhotos[index] = previewUrl;
        return newPhotos;
      });

      // Notify parent component with original file (no compression)
      onAdditionalPhotosChange?.(index, file);
    },
    [additionalPhotos, onAdditionalPhotosChange]
  );

  // ========== Render ==========

  return (
    <FormSection
      title="프로필"
      description="나를 가장 잘 표현할 수 있는 사진을 선택하세요!"
    >
      {/* Hidden file inputs */}
      <input
        ref={mainPhotoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleMainPhotoFileChange}
        className="hidden"
      />
      {[0, 1, 2].map((index) => (
        <input
          key={index}
          ref={(el) => {
            additionalPhotoInputRefs.current[index] = el;
          }}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleAdditionalPhotoFileChange(e, index)}
          className="hidden"
        />
      ))}

      <div className="flex gap-2">
        {/* Main Photo - 2:3 ratio (세로가 긴), takes 2/3 of width */}
        <button
          type="button"
          onClick={handleMainPhotoUpload}
          className="relative flex-[2] aspect-[2/3] rounded-2xl overflow-hidden bg-muted/50 border-2 border-dashed border-border hover:border-primary transition-colors group"
        >
          {mainPhoto ? (
            <ImageWithFallback
              src={mainPhoto}
              alt="Profile"
              fill
              sizes="(max-width: 768px) 66vw, 400px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          )}
        </button>

        {/* Additional Photos - takes 1/3 of width, height matches main photo via aspect ratio */}
        <div className="flex-[1] aspect-[2/3] flex flex-col gap-2">
          {additionalPhotos.map((photo, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleAdditionalPhotoUpload(index)}
              className="relative w-full flex-1 rounded-xl overflow-hidden bg-muted/50 border-2 border-dashed border-border hover:border-primary transition-colors group"
            >
              {photo ? (
                <ImageWithFallback
                  src={photo}
                  alt={`Additional photo ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 33vw, 200px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

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
