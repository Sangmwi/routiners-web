'use client';

import { useState, useEffect } from 'react';
import MainTabLayout from '@/components/common/MainTabLayout';
import MainTabHeader from '@/components/common/MainTabHeader';
import CommunityHeader from '@/components/community/CommunityHeader';
import CategoryTabs from '@/components/community/CategoryTabs';
import PostCard from '@/components/community/PostCard';
import { PulseLoader } from '@/components/ui/PulseLoader';

// 더미 데이터
const DUMMY_POSTS = [
  {
    id: '1',
    author: '헬린이1',
    timeAgo: '1시간 전',
    content: '오늘 운동 완료했습니다! 벤치프레스 신기록 달성 💪 #오운완 #삼평오',
    likes: 12,
    comments: 3,
  },
  {
    id: '2',
    author: '헬창2',
    timeAgo: '2시간 전',
    content: '군대에서 할 수 있는 효과적인 맨몸운동 루틴 공유합니다! 푸쉬업 100개 → 스쿼트 100개 → 플랭크 3분',
    likes: 24,
    comments: 8,
  },
  {
    id: '3',
    author: '삼평오킹',
    timeAgo: '3시간 전',
    content: '식단 조언 부탁드립니다. PX에서 살 수 있는 건강한 간식 추천해주세요!',
    likes: 7,
    comments: 15,
  },
  {
    id: '4',
    author: '근육병장',
    timeAgo: '5시간 전',
    content: '3대 운동 500kg 돌파! 동기들한테 지지 않는다 🔥',
    likes: 45,
    comments: 12,
  },
  {
    id: '5',
    author: '체력이병',
    timeAgo: '1일 전',
    content: '아침 구보 후 근력운동 vs 저녁에만 운동하기.. 뭐가 더 효과적일까요?',
    likes: 18,
    comments: 22,
  },
];

export default function CommunityPage() {
  // TODO: 실제 데이터 페칭으로 교체 시 isPending 사용
  const [isLoading, setIsLoading] = useState(true);

  // 시뮬레이션: 더미 데이터 로딩
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleNewPost = () => {
    // TODO: 새 글 작성 페이지로 이동
    console.log('새 글 작성');
  };

  const handleFilter = () => {
    // TODO: 필터 모달 열기
    console.log('필터');
  };

  const handleCategoryChange = (categoryId: string) => {
    // TODO: 카테고리별 게시글 필터링
    console.log('카테고리 변경:', categoryId);
  };

  const handlePostClick = (postId: string) => {
    // TODO: 게시글 상세 페이지로 이동
    console.log('게시글 클릭:', postId);
  };

  if (isLoading) {
    return (
      <MainTabLayout>
        <MainTabHeader title="커뮤니티" />
        <PulseLoader />
      </MainTabLayout>
    );
  }

  return (
    <MainTabLayout>
      <CommunityHeader onNewPost={handleNewPost} onFilter={handleFilter} />
      <CategoryTabs onCategoryChange={handleCategoryChange} />

      <div className="space-y-4">
        {DUMMY_POSTS.map((post) => (
          <PostCard
            key={post.id}
            author={post.author}
            timeAgo={post.timeAgo}
            content={post.content}
            likes={post.likes}
            comments={post.comments}
            onClick={() => handlePostClick(post.id)}
          />
        ))}
      </div>
    </MainTabLayout>
  );
}

