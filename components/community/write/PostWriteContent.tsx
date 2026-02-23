'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/icons';
import { useCommunityPostQuery } from '@/hooks/community/queries';
import {
  useCreatePost,
  useUpdatePost,
  useUploadImages,
} from '@/hooks/community/mutations';
import type { PostCategory } from '@/lib/types/community';
import CategorySelector from './CategorySelector';
import ImageUploader from './ImageUploader';

interface PostWriteContentProps {
  editPostId: string | null;
}

const MAX_CONTENT_LENGTH = 2000;

export default function PostWriteContent({ editPostId }: PostWriteContentProps) {
  const router = useRouter();
  const isEdit = !!editPostId;

  // 수정 모드: 기존 데이터 로드
  const { data: existingPost } = useCommunityPostQuery(editPostId);

  // 폼 상태
  const [category, setCategory] = useState<PostCategory>('general');
  const [content, setContent] = useState('');
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Mutations
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const uploadImages = useUploadImages();

  const isSubmitting =
    createPost.isPending || updatePost.isPending || uploadImages.isPending;

  // 수정 모드: 기존 데이터로 폼 초기화
  useEffect(() => {
    if (existingPost) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategory(existingPost.category);
      setContent(existingPost.content);
      setExistingImageUrls(existingPost.imageUrls);
    }
  }, [existingPost]);

  const totalImageCount = existingImageUrls.length + newFiles.length;
  const canSubmit =
    content.trim().length > 0 &&
    content.length <= MAX_CONTENT_LENGTH &&
    !isSubmitting;

  const handleRemoveExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddFiles = (files: File[]) => {
    const remaining = 4 - totalImageCount;
    setNewFiles((prev) => [...prev, ...files.slice(0, remaining)]);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      // 새 이미지 업로드
      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        uploadedUrls = await uploadImages.mutateAsync(newFiles);
      }

      const allImageUrls = [...existingImageUrls, ...uploadedUrls];

      if (isEdit && editPostId) {
        await updatePost.mutateAsync({
          postId: editPostId,
          data: {
            content: content.trim(),
            imageUrls: allImageUrls,
          },
        });
        router.replace('/community');
      } else {
        await createPost.mutateAsync({
          category,
          content: content.trim(),
          imageUrls: allImageUrls.length > 0 ? allImageUrls : undefined,
        });
        router.back();
      }
    } catch {
      // 에러는 mutation의 onError에서 처리
    }
  };

  return (
    <div className="space-y-5">
      {/* 카테고리 선택 */}
      <CategorySelector
        selected={category}
        onChange={setCategory}
        disabled={isEdit}
      />

      {/* 내용 입력 */}
      <div className="space-y-1.5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="자유롭게 이야기를 나눠보세요"
          maxLength={MAX_CONTENT_LENGTH}
          rows={8}
          className="w-full rounded-xl border border-border bg-card text-foreground px-4 py-3 text-sm leading-relaxed resize-none transition-all focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 placeholder:text-muted-foreground"
        />
        <p className="text-right text-xs text-muted-foreground">
          <span className={content.length > MAX_CONTENT_LENGTH ? 'text-destructive' : ''}>
            {content.length}
          </span>
          /{MAX_CONTENT_LENGTH}
        </p>
      </div>

      {/* 이미지 업로드 */}
      <ImageUploader
        existingUrls={existingImageUrls}
        newFiles={newFiles}
        maxCount={4}
        onAddFiles={handleAddFiles}
        onRemoveExisting={handleRemoveExistingImage}
        onRemoveNew={handleRemoveNewFile}
      />

      {/* 등록 버튼 */}
      <Button
        variant="primary"
        size="lg"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner size="sm" variant="current" />
            {uploadImages.isPending ? '이미지 업로드 중...' : '등록 중...'}
          </span>
        ) : isEdit ? (
          '수정 완료'
        ) : (
          '등록'
        )}
      </Button>
    </div>
  );
}
