'use client';

import { useRouter } from 'next/navigation';
import PostCard from './PostCard';
import { useCommunityPosts } from '@/hooks/community/queries';
import { useToggleLike } from '@/hooks/community/mutations';
import type { PostCategory } from '@/lib/types/community';

interface CommunityContentProps {
  category: PostCategory | 'all';
}

/**
 * 커뮤니티 게시글 목록 (Suspense 내부 컴포넌트)
 *
 * - useSuspenseQuery로 게시글 목록 조회
 * - 상위 CommunityClient의 Suspense boundary에 의해 로딩 처리
 */
export default function CommunityContent({
  category,
}: CommunityContentProps) {
  const router = useRouter();
  const { data } = useCommunityPosts({ category: category === 'all' ? undefined : category });
  const toggleLike = useToggleLike();

  const handleNewPost = () => {
    router.push('/community/write');
  };

  const handlePostClick = (postId: string) => {
    router.push(`/community/${postId}`);
  };

  const handleLike = (postId: string) => {
    toggleLike.mutate(postId);
  };

  return (
    <div className="space-y-4">
      {data.posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-2">아직 게시글이 없어요</p>
          <button
            onClick={handleNewPost}
            className="text-sm text-primary hover:underline"
          >
            첫 번째 글을 작성해보세요
          </button>
        </div>
      ) : (
        data.posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onClick={() => handlePostClick(post.id)}
            onLike={() => handleLike(post.id)}
          />
        ))
      )}
    </div>
  );
}
