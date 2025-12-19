'use client';

import { useState, useRef, useEffect } from 'react';
import { User } from '@/lib/types';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import FormSection from '@/components/ui/FormSection';
import { Plus, Loader2 } from 'lucide-react';
import { compressImage, isImageFile, formatFileSize } from '@/lib/utils/imageCompression';

interface ProfilePhotoUploadSectionProps {
  user: User;
  onMainPhotoChange?: (file: File | null) => void;
  onAdditionalPhotosChange?: (index: number, file: File | null) => void;
}

export default function ProfilePhotoUploadSection({
  user,
  onMainPhotoChange,
  onAdditionalPhotosChange
}: ProfilePhotoUploadSectionProps) {
  const [mainPhoto, setMainPhoto] = useState(user.profileImages?.[0]);
  const [additionalPhotos, setAdditionalPhotos] = useState<(string | null)[]>([null, null, null]);
  const [isCompressing, setIsCompressing] = useState(false);

  const mainPhotoInputRef = useRef<HTMLInputElement>(null);
  const additionalPhotoInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Store blob URLs for cleanup
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    };
  }, []);

  const handleMainPhotoUpload = () => {
    mainPhotoInputRef.current?.click();
  };

  const handleAdditionalPhotoUpload = (index: number) => {
    additionalPhotoInputRefs.current[index]?.click();
  };

  const handleMainPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isImageFile(file)) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setIsCompressing(true);

    try {
      const originalSize = formatFileSize(file.size);
      console.log(`압축 전 크기: ${originalSize}`);

      // Compress image
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        quality: 0.8,
      });

      const compressedSize = formatFileSize(compressedFile.size);
      console.log(`압축 후 크기: ${compressedSize}`);

      // Create local preview URL
      const previewUrl = URL.createObjectURL(compressedFile);

      // Clean up old blob URL if exists
      if (mainPhoto && mainPhoto.startsWith('blob:')) {
        URL.revokeObjectURL(mainPhoto);
        blobUrlsRef.current.delete(mainPhoto);
      }

      // Store new blob URL for cleanup
      blobUrlsRef.current.add(previewUrl);

      // Update UI with preview
      setMainPhoto(previewUrl);

      // Notify parent component with compressed file
      onMainPhotoChange?.(compressedFile);
    } catch (error) {
      console.error('Failed to compress photo:', error);
      alert('사진 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAdditionalPhotoFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isImageFile(file)) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setIsCompressing(true);

    try {
      const originalSize = formatFileSize(file.size);
      console.log(`압축 전 크기: ${originalSize}`);

      // Compress image
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        quality: 0.8,
      });

      const compressedSize = formatFileSize(compressedFile.size);
      console.log(`압축 후 크기: ${compressedSize}`);

      // Create local preview URL
      const previewUrl = URL.createObjectURL(compressedFile);

      // Clean up old blob URL if exists
      const oldPhoto = additionalPhotos[index];
      if (oldPhoto && oldPhoto.startsWith('blob:')) {
        URL.revokeObjectURL(oldPhoto);
        blobUrlsRef.current.delete(oldPhoto);
      }

      // Store new blob URL for cleanup
      blobUrlsRef.current.add(previewUrl);

      // Update UI with preview
      const newPhotos = [...additionalPhotos];
      newPhotos[index] = previewUrl;
      setAdditionalPhotos(newPhotos);

      // Notify parent component with compressed file
      onAdditionalPhotosChange?.(index, compressedFile);
    } catch (error) {
      console.error('Failed to compress photo:', error);
      alert('사진 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsCompressing(false);
    }
  };

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
          disabled={isCompressing}
          className="relative flex-[2] aspect-[2/3] rounded-2xl overflow-hidden bg-muted/50 border-2 border-dashed border-border hover:border-primary transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
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
              {isCompressing ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
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
              disabled={isCompressing}
              className="relative w-full flex-1 rounded-xl overflow-hidden bg-muted/50 border-2 border-dashed border-border hover:border-primary transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {isCompressing ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </FormSection>
  );
}
