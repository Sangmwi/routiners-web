'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImageSquareIcon, ImagesIcon } from '@phosphor-icons/react';
import { ImageWithFallback } from '@/components/ui/image';
import { useUserPosts } from '@/hooks/community/useUserPosts';
import type { CommunityPost } from '@/lib/types/community';
import { LoadingSpinner } from '@/components/ui/icons';
import AppLink from '@/components/common/AppLink';

interface ProfileActivityGridProps {
  userId: string;
}

// ============================================================
// Sub Components
// ============================================================

function GridCell({ post }: { post: CommunityPost }) {
  const router = useRouter();
  const hasImages = post.imageUrls.length > 0;
  const hasMultipleImages = post.imageUrls.length > 1;

  return (
    <button
      onClick={() => router.push(`/community/${post.id}`)}
      className="aspect-square relative overflow-hidden bg-muted/20"
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
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <ImageSquareIcon size={40} className="text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">아직 활동이 없어요</p>
      <AppLink
        href="/community/write"
        className="text-sm font-medium text-primary hover:underline"
      >
        첫 글 작성하기
      </AppLink>
    </div>
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
    isLoading,
  } = useUserPosts(userId);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  // Infinite scroll observer
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (posts.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post) => (
          <GridCell key={post.id} post={post} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" />
        </div>
      )}
    </>
  );
}
