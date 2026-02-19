'use client';

import { useRef } from 'react';
import { CameraIcon, XCircleIcon } from '@phosphor-icons/react';
import { ImageWithFallback } from '@/components/ui/image';

interface ImageUploaderProps {
  existingUrls: string[];
  newFiles: File[];
  maxCount: number;
  onAddFiles: (files: File[]) => void;
  onRemoveExisting: (index: number) => void;
  onRemoveNew: (index: number) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ImageUploader({
  existingUrls,
  newFiles,
  maxCount,
  onAddFiles,
  onRemoveExisting,
  onRemoveNew,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalCount = existingUrls.length + newFiles.length;
  const canAddMore = totalCount < maxCount;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // 파일 유효성 검사
    const validFiles = files.filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return false;
      if (file.size > MAX_FILE_SIZE) return false;
      return true;
    });

    if (validFiles.length > 0) {
      onAddFiles(validFiles);
    }

    // input 초기화 (같은 파일 재선택 가능)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 새 파일의 미리보기 URL 생성
  const newFilePreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        사진 ({totalCount}/{maxCount})
      </label>

      <div className="grid grid-cols-4 gap-2">
        {/* 기존 이미지 */}
        {existingUrls.map((url, index) => (
          <div
            key={`existing-${index}`}
            className="relative aspect-square rounded-xl overflow-hidden"
          >
            <ImageWithFallback
              src={url}
              alt={`이미지 ${index + 1}`}
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => onRemoveExisting(index)}
              className="absolute top-1 right-1 text-white drop-shadow-md"
            >
              <XCircleIcon size={22} weight="fill" />
            </button>
          </div>
        ))}

        {/* 새 파일 미리보기 */}
        {newFilePreviewUrls.map((url, index) => (
          <div
            key={`new-${index}`}
            className="relative aspect-square rounded-xl overflow-hidden"
          >
            <img
              src={url}
              alt={`새 이미지 ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemoveNew(index)}
              className="absolute top-1 right-1 text-white drop-shadow-md"
            >
              <XCircleIcon size={22} weight="fill" />
            </button>
          </div>
        ))}

        {/* 추가 버튼 */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 hover:bg-muted/20 transition-colors"
          >
            <CameraIcon size={24} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">추가</span>
          </button>
        )}
      </div>

      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
