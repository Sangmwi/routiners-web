'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { MainTabLayout, MainTabHeader } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import CategoryTabs from '@/components/community/CategoryTabs';
import SearchBar from '@/components/community/SearchBar';
import FilterModal, { type DateRange } from '@/components/community/FilterModal';
import Button from '@/components/ui/Button';
import { PencilSimpleLineIcon, FunnelIcon } from '@phosphor-icons/react';
import type { PostCategory } from '@/lib/types/community';

const CommunityContent = dynamic(
  () => import('@/components/community/CommunityContent'),
  { ssr: false }
);

const VALID_CATEGORIES = ['general', 'workout', 'meal', 'qna'] as const;

/**
 * 커뮤니티 페이지
 */
export default function CommunityPage() {
  const router = useRouter();
  const [category, setCategory] = useState<PostCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [filterOpen, setFilterOpen] = useState(false);

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

  const hasActiveFilter = dateRange !== 'all';

  return (
    <MainTabLayout>
      <MainTabHeader
        title="커뮤니티"
        action={
          <>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setFilterOpen(true)}
              className={hasActiveFilter ? 'border-primary text-primary' : ''}
            >
              <FunnelIcon size={16} weight={hasActiveFilter ? 'fill' : 'regular'} />
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
      <SearchBar onSearchChange={setSearch} />
      <QueryErrorBoundary>
        <CommunityContent
          category={category}
          search={search}
          dateRange={dateRange}
        />
      </QueryErrorBoundary>

      <FilterModal
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        dateRange={dateRange}
        onApply={setDateRange}
      />
    </MainTabLayout>
  );
}
