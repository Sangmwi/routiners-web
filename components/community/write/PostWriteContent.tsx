'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/icons';
import { useCommunityPostQuery } from '@/hooks/community/queries';
import {
  useCreatePost,
  useUpdatePost,
  useUploadImages,
} from '@/hooks/community/mutations';
import type { PostCategory } from '@/lib/types/community';
import { PostFormSchema, PostFormErrors, POST_CONTENT_MAX } from '@/lib/types/community';
import { useShowError } from '@/lib/stores/errorStore';
import { collectZodErrors } from '@/lib/utils/formValidation';
import CategorySelector from './CategorySelector';
import ImageUploader from './ImageUploader';

interface PostWriteContentProps {
  editPostId: string | null;
}

const WARN_THRESHOLD = 200;

const CATEGORY_PLACEHOLDERS: Record<PostCategory, string> = {
  general: '자유롭게 이야기를 나눠보세요',
  workout: '오늘의 운동을 인증해보세요',
  meal: '오늘 먹은 식단을 공유해보세요',
  qna: '궁금한 점을 질문해보세요',
};

// 원형 문자수 카운터 컴포넌트
function CharacterCounter({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  const remaining = max - current;
  const isWarning = remaining < WARN_THRESHOLD && current > 0;
  const isOver = current > max;

  if (current === 0) return null;

  const radius = 9;
  const strokeWidth = 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / max, 1);
  const dashOffset = circumference * (1 - progress);

  const trackColor = 'var(--edge-subtle)';
  const fillColor = isOver
    ? 'var(--destructive)'
    : isWarning
      ? 'var(--warning)'
      : 'var(--primary)';

  return (
    <div className="absolute bottom-3 right-0 flex items-center gap-1.5">
      {isWarning && (
        <span
          className={`text-xs tabular-nums ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {isOver ? `-${Math.abs(remaining)}` : remaining}
        </span>
      )}
      <svg
        width={radius * 2 + strokeWidth}
        height={radius * 2 + strokeWidth}
        viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`}
        className="-rotate-90"
      >
        {/* 트랙 */}
        <circle
          cx={radius + strokeWidth / 2}
          cy={radius + strokeWidth / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* 프로그레스 */}
        <circle
          cx={radius + strokeWidth / 2}
          cy={radius + strokeWidth / 2}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function PostWriteContent({ editPostId }: PostWriteContentProps) {
  const router = useRouter();
  const isEdit = !!editPostId;

  const { data: existingPost } = useCommunityPostQuery(editPostId);

  const [category, setCategory] = useState<PostCategory>('general');
  const [content, setContent] = useState('');
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [postFormErrors, setPostFormErrors] = useState<PostFormErrors>({});

  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const uploadImages = useUploadImages();
  const showError = useShowError();

  const isSubmitting =
    createPost.isPending || updatePost.isPending || uploadImages.isPending;

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
    content.length <= POST_CONTENT_MAX &&
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
    if (isSubmitting) return;

    // Zod 클라이언트 검증
    const result = PostFormSchema.safeParse({ content: content.trim(), category });
    if (!result.success) {
      setPostFormErrors(collectZodErrors<keyof PostFormErrors>(result.error));
      return;
    }
    setPostFormErrors({});

    try {
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
      showError(isEdit ? '수정에 실패했어요' : '게시글 등록에 실패했어요');
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-var(--safe-top)-3rem)]">
      {/* 스크롤 영역 — 직접 px 패딩 관리 (DetailLayout padding={false}) */}
      <div className="flex-1 px-(--layout-padding-x) space-y-5 pb-24 pt-1">
        {/* 카테고리 */}
        <CategorySelector
          selected={category}
          onChange={setCategory}
          disabled={isEdit}
        />

        {/* 구분선 */}
        <div className="border-t border-edge-faint" />

        {/* 텍스트에어리어 */}
        <div className="relative pb-6">
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setPostFormErrors({}); }}
            placeholder={CATEGORY_PLACEHOLDERS[category]}
            maxLength={POST_CONTENT_MAX + 50}
            rows={10}
            className="w-full border-none bg-transparent text-foreground text-sm leading-relaxed resize-none focus:outline-none placeholder:text-hint"
          />
          <CharacterCounter current={content.length} max={POST_CONTENT_MAX} />
        </div>
        {postFormErrors.content && (
          <p className="text-xs text-destructive -mt-4">{postFormErrors.content}</p>
        )}
      </div>

      {/* 하단 고정 toolbar — shrink-0으로 flex 끝에 고정, sticky로 스크롤 시 고정 */}
      <div className="shrink-0 sticky bottom-0 z-10 border-t border-edge-faint bg-background/95 backdrop-blur-sm px-(--layout-padding-x) py-2.5 pb-safe">
        <div className="flex items-center gap-2">
          <ImageUploader
            existingUrls={existingImageUrls}
            newFiles={newFiles}
            maxCount={4}
            onAddFiles={handleAddFiles}
            onRemoveExisting={handleRemoveExistingImage}
            onRemoveNew={handleRemoveNewFile}
          />

          {/* 등록/수정 버튼 */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="ml-auto shrink-0 rounded-full px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" variant="current" />
            ) : isEdit ? (
              '수정 완료'
            ) : (
              '등록'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
