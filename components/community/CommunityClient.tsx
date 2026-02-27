'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainTabLayout } from '@/components/layouts';
import CommunityHeader from './CommunityHeader';
import CategoryTabs from './CategoryTabs';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';
import CommunityContent from './CommunityContent';
import type { PostCategory } from '@/lib/types/community';

const VALID_CATEGORIES = ['general', 'workout', 'meal', 'qna'] as const;

/**
 * 커뮤니티 탭 메인 클라이언트 컴포넌트
 *
 * - URL의 ?category= 파라미터를 클라이언트에서 직접 읽음
 * - 헤더 + 카테고리 탭 즉시 표시 (Suspense 밖)
 * - Suspense로 게시글 목록 로딩 자동 관리
 * - QueryErrorBoundary로 에러 자동 처리
 */
export default function CommunityClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlCategory = searchParams.get('category');
  const initialCategory =
    urlCategory && (VALID_CATEGORIES as readonly string[]).includes(urlCategory)
      ? (urlCategory as PostCategory)
      : 'all';

  const [category, setCategory] = useState<PostCategory | 'all'>(initialCategory);

  const handleNewPost = () => {
    router.push('/community/write');
  };

  const handleCategoryChange = (categoryId: string) => {
    const newCategory = categoryId as PostCategory | 'all';
    setCategory(newCategory);

    // URL 업데이트 (shallow)
    const params = new URLSearchParams();
    if (newCategory !== 'all') {
      params.set('category', newCategory);
    }
    const queryString = params.toString();
    router.push(`/community${queryString ? `?${queryString}` : ''}`, {
      scroll: false,
    });
  };

  return (
    <MainTabLayout>
      <CommunityHeader onNewPost={handleNewPost} />
      <CategoryTabs
        selectedCategory={category}
        onCategoryChange={handleCategoryChange}
      />
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <CommunityContent category={category} />
        </Suspense>
      </QueryErrorBoundary>
    </MainTabLayout>
  );
}
