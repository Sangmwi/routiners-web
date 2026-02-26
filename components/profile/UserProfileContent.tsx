'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useUserProfileSuspense } from '@/hooks/profile/queries';
import { useUserPostCount } from '@/hooks/community/useUserPostCount';
import type { ProfileTab } from '@/components/profile/ProfileTabBar';
import ProfileCompactHeader from '@/components/profile/ProfileCompactHeader';
import ProfileTabBar from '@/components/profile/ProfileTabBar';
import ProfileActivityGrid from '@/components/profile/ProfileActivityGrid';
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import { PulseLoader } from '@/components/ui/PulseLoader';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';

interface UserProfileContentProps {
  userId: string;
}

/**
 * 다른 사용자 프로필 콘텐츠 (읽기 전용)
 */
export default function UserProfileContent({ userId }: UserProfileContentProps) {
  const { data: user } = useUserProfileSuspense(userId);
  const { data: postCount = 0 } = useUserPostCount(userId);
  const [activeTab, setActiveTab] = useState<ProfileTab>('activity');
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const prevTab = useRef(activeTab);

  useEffect(() => {
    if (prevTab.current !== activeTab) {
      setDirection(activeTab === 'info' ? 'right' : 'left');
      prevTab.current = activeTab;
    }
  }, [activeTab]);

  // 프라이버시 설정: 비공개 탭 숨기기
  const privateTabs: ProfileTab[] = [];
  if (user.showActivityPublic === false) privateTabs.push('activity');
  if (user.showInfoPublic === false) privateTabs.push('info');

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>사용자를 찾을 수 없어요.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4 px-2">
        <ProfileCompactHeader user={user} />

        {/* 스탯 (읽기 전용) */}
        <div className="flex items-center gap-3 text-sm">
          <span>
            <span className="font-semibold text-foreground">{postCount}</span>
            <span className="text-muted-foreground ml-1">게시글</span>
          </span>
          <span>
            <span className="font-semibold text-foreground">0</span>
            <span className="text-muted-foreground ml-1">팔로워</span>
          </span>
          <span>
            <span className="font-semibold text-foreground">0</span>
            <span className="text-muted-foreground ml-1">팔로잉</span>
          </span>
        </div>
      </div>

      <ProfileTabBar activeTab={activeTab} onTabChange={setActiveTab} privateTabs={privateTabs} />

      <div className="mt-4 [overflow-x:clip] -mx-(--layout-padding-x) px-(--layout-padding-x)">
        <div
          key={activeTab}
          className="animate-tab-slide"
          style={{
            '--slide-from': direction === 'right' ? '30px' : '-30px',
          } as React.CSSProperties}
        >
          <QueryErrorBoundary>
            <Suspense fallback={<PulseLoader />}>
              {activeTab === 'activity' && (
                privateTabs.includes('activity') ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p className="text-sm">비공개 활동이에요</p>
                  </div>
                ) : (
                  <ProfileActivityGrid userId={userId} />
                )
              )}
              {activeTab === 'info' && (
                privateTabs.includes('info') ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p className="text-sm">비공개 정보에요</p>
                  </div>
                ) : (
                  <ProfileInfoTab user={user} isOwnProfile={false} userId={userId} />
                )
              )}
            </Suspense>
          </QueryErrorBoundary>
        </div>
      </div>
    </div>
  );
}
