'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { MainTabLayout, MainTabHeader } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';
import CategoryTabs from '@/components/community/CategoryTabs';
import Button from '@/components/ui/Button';
import { PencilSimpleLineIcon, FunnelIcon } from '@phosphor-icons/react';
import type { PostCategory } from '@/lib/types/community';

const CommunityContent = dynamic(
  () => import('@/components/community/CommunityContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

const VALID_CATEGORIES = ['general', 'workout', 'meal', 'qna'] as const;

/**
 * 커뮤니티 페이지
 *
 * - Layout + Header + CategoryTabs: 즉시 렌더링 (Suspense 밖)
 * - 단일 Suspense: 번들 + 데이터 로딩 모두 처리
 * - 깜빡임 없는 로딩 UX
 */
export default function CommunityPage() {
  const router = useRouter();
  const [category, setCategory] = useState<PostCategory | 'all'>('all');

  // URL에서 초기 카테고리 읽기 (클라이언트 사이드)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get('category');
    if (urlCategory && (VALID_CATEGORIES as readonly string[]).includes(urlCategory)) {
      setCategory(urlCategory as PostCategory);
    }
  }, []);

  const handleNewPost = () => {
    router.push('/community/write');
  };

  const handleFilter = () => {
    // TODO: 필터 모달 열기
    console.log('필터');
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
      <MainTabHeader
        title="커뮤니티"
        action={
          <>
            <Button variant="outline" size="xs" onClick={handleFilter}>
              <FunnelIcon size={16} />
            </Button>
            <Button variant="primary" size="xs" onClick={handleNewPost}>
              <PencilSimpleLineIcon size={16} />
              글쓰기
            </Button>
          </>
        }
      />
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
