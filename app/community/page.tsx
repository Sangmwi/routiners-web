'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const CommunityContent = dynamic(
  () => import('@/components/community/CommunityContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);
import { MainTabLayout, MainTabHeader } from '@/components/layouts';
import StickyControlZone from '@/components/ui/StickyControlZone';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import EmptyState from '@/components/common/EmptyState';
import { PulseLoader } from '@/components/ui/PulseLoader';
import PrimaryTabs, { type PrimaryTab } from '@/components/community/PrimaryTabs';
import FilterSheet, { type DateRange } from '@/components/community/FilterSheet';
import { UserFocusIcon, PlusIcon, FunnelIcon } from '@phosphor-icons/react';
import { EMPTY_STATE } from '@/lib/config/theme';
import type { PostCategory } from '@/lib/types/community';
import { createRouteStateKey } from '@/lib/route-state/keys';
import { useRouteState } from '@/hooks/navigation';

const VALID_CATEGORIES = ['general', 'workout', 'meal', 'qna'] as const;

/**
 * 커뮤니티 페이지
 */
export default function CommunityPage() {
  const router = useRouter();
  const pathname = usePathname();
  const routeKey = createRouteStateKey(pathname);
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const urlCategory = searchParams.get('category');
  const initialCategory: PostCategory | 'all' =
    urlCategory && (VALID_CATEGORIES as readonly string[]).includes(urlCategory)
      ? (urlCategory as PostCategory)
      : 'all';

  const { state, setState } = useRouteState<{
    primaryTab: PrimaryTab;
    category: PostCategory | 'all';
    dateRange: DateRange;
  }>({
    key: routeKey,
    initialState: {
      primaryTab: 'recommended',
      category: initialCategory,
      dateRange: 'all',
    },
  });
  const { primaryTab, category, dateRange } = state;

  const handleNewPost = () => {
    router.push('/community/write');
  };

  const handleSearchUsers = () => {
    router.push('/community/search-users');
  };

  const handleCategoryChange = (cat: PostCategory | 'all') => {
    setState((prev) => ({ ...prev, category: cat }));

    // URL 업데이트 (shallow)
    const params = new URLSearchParams();
    if (cat !== 'all') {
      params.set('category', cat);
    }
    const queryString = params.toString();
    router.push(`/community${queryString ? `?${queryString}` : ''}`, {
      scroll: false,
    });
  };

  const handleDateRangeChange = (range: DateRange) => {
    setState((prev) => ({ ...prev, dateRange: range }));
  };

  const isFilterActive = category !== 'all' || dateRange !== 'all';

  return (
    <MainTabLayout>
      <MainTabHeader title="커뮤니티" />

      {/* sticky 컨트롤 존: 탭 + 액션 버튼 */}
      <StickyControlZone>
        <PrimaryTabs
          activeTab={primaryTab}
          onTabChange={(nextTab) => setState((prev) => ({ ...prev, primaryTab: nextTab }))}
          actions={
            <>
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className="relative p-2 rounded-xl hover:bg-surface-muted active:bg-surface-pressed transition-colors"
                aria-label="필터"
              >
                <FunnelIcon size={22} className="text-muted-foreground" />
                {isFilterActive && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
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
      </StickyControlZone>

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
              />
            </Suspense>
          </QueryErrorBoundary>
        </div>
      )}

      <FilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        category={category}
        onCategoryChange={handleCategoryChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
      />
    </MainTabLayout>
  );
}
