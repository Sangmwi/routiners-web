'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImagesIcon } from '@phosphor-icons/react';
import { EMPTY_STATE } from '@/lib/config/theme';
import { ImageWithFallback } from '@/components/ui/image';
import { useUserPostsSuspense } from '@/hooks/community/useUserPosts';
import type { CommunityPost } from '@/lib/types/community';
import { LoadingSpinner } from '@/components/ui/icons';
import SharedEmptyState from '@/components/common/EmptyState';

interface ProfileActivityGridProps {
  userId: string;
}

// ============================================================
// Sub Components
// ============================================================

function GridCell({ post, userId, index }: { post: CommunityPost; userId: string; index: number }) {
  const router = useRouter();
  const hasImages = post.imageUrls.length > 0;
  const hasMultipleImages = post.imageUrls.length > 1;

  return (
    <button
      onClick={() => router.push(`/profile/user/${userId}/posts?startIndex=${index}`)}
      className="aspect-square relative overflow-hidden bg-surface-secondary"
    >
      {hasImages ? (
        <>
          <ImageWithFallback
            src={post.imageUrls[0]}
            alt=""
            fill
            sizes="(max-width: 768px) 33vw, 150px"
            className="object-cover"
            optimizePreset="card"
          />
          {hasMultipleImages && (
            <div className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-1">
              <ImagesIcon size={12} className="text-white" />
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2">
          <p className="text-xs text-muted-foreground line-clamp-3 text-center leading-relaxed">
            {post.content}
          </p>
        </div>
      )}
    </button>
  );
}

function EmptyState() {
  return (
    <SharedEmptyState
      {...EMPTY_STATE.community.noActivity}
      action={{ label: '첫 글 작성하기', href: '/community/write' }}
      size="lg"
    />
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ProfileActivityGrid({ userId }: ProfileActivityGridProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserPostsSuspense(userId);

  const posts = data.pages.flatMap((page) => page.posts);

  // Infinite scroll observer
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = (entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  if (posts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="-mx-(--layout-padding-x)">
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post, index) => (
          <GridCell key={post.id} post={post} userId={userId} index={index} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" />
        </div>
      )}
    </div>
  );
}
