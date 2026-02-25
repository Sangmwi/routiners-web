'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { MainTabLayout, MainTabHeader } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import EmptyState from '@/components/common/EmptyState';
import { PulseLoader } from '@/components/ui/PulseLoader';
import PrimaryTabs, { type PrimaryTab } from '@/components/community/PrimaryTabs';
import CategoryTabs from '@/components/community/CategoryTabs';
import FilterModal, { type DateRange } from '@/components/community/FilterModal';
import { UserFocusIcon, PlusIcon } from '@phosphor-icons/react';
import { EMPTY_STATE } from '@/lib/config/theme';
import type { PostCategory } from '@/lib/types/community';

const CommunityContent = dynamic(
  () => import('@/components/community/CommunityContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

const VALID_CATEGORIES = ['general', 'workout', 'meal', 'qna'] as const;

/**
 * 커뮤니티 페이지
 */
export default function CommunityPage() {
  const router = useRouter();
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('recommended');
  const [category, setCategory] = useState<PostCategory | 'all'>(() => {
    if (typeof window === 'undefined') return 'all';
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get('category');
    if (urlCategory && (VALID_CATEGORIES as readonly string[]).includes(urlCategory)) {
      return urlCategory as PostCategory;
    }
    return 'all';
  });
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const handleNewPost = () => {
    router.push('/community/write');
  };

  const handleSearchUsers = () => {
    router.push('/community/search-users');
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
            <button
              type="button"
              onClick={handleSearchUsers}
              className="p-2 rounded-xl hover:bg-surface-muted active:bg-surface-pressed transition-colors"
              aria-label="사용자 검색"
            >
              <UserFocusIcon size={22} className="text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={handleNewPost}
              className="p-2 rounded-xl hover:bg-surface-muted active:bg-surface-pressed transition-colors"
              aria-label="글쓰기"
            >
              <PlusIcon size={22} className="text-muted-foreground" />
            </button>
          </>
        }
      />

      {/* 필터 존: 메인탭 + 카테고리 서브탭 */}
      <div className="flex flex-col gap-4">
        <PrimaryTabs
          activeTab={primaryTab}
          onTabChange={setPrimaryTab}
          hasActiveFilter={hasActiveFilter}
          onFilterOpen={() => setFilterOpen(true)}
        />
        <CategoryTabs
          selectedCategory={category}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* 콘텐츠 영역 */}
      {primaryTab === 'following' ? (
        <EmptyState
          {...EMPTY_STATE.community.noFollowing}
          action={{
            label: '사용자 찾기',
            onClick: handleSearchUsers,
          }}
          size="lg"
        />
      ) : (
        <div
          key={primaryTab}
          className="animate-tab-slide"
          style={{ '--slide-from': '-30px' } as React.CSSProperties}
        >
          <QueryErrorBoundary>
            <Suspense fallback={<PulseLoader />}>
              <CommunityContent
                category={category}
                dateRange={dateRange}
              />
            </Suspense>
          </QueryErrorBoundary>
        </div>
      )}

      <FilterModal
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        dateRange={dateRange}
        onApply={setDateRange}
      />
    </MainTabLayout>
  );
}
