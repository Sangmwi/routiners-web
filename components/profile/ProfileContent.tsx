'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { PencilSimpleIcon, LockSimpleIcon } from '@phosphor-icons/react';
import { useCurrentUserProfileSuspense } from '@/hooks/profile';
import type { ProfileTab } from '@/components/profile/ProfileTabBar';
import ProfileCompactHeader from '@/components/profile/ProfileCompactHeader';
import ProfileActionRow from '@/components/profile/ProfileActionRow';
import ProfileTabBar from '@/components/profile/ProfileTabBar';
import ProfileActivityGrid from '@/components/profile/ProfileActivityGrid';
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import AppLink from '@/components/common/AppLink';
import { PulseLoader } from '@/components/ui/PulseLoader';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';

/**
 * 소셜 프로필 페이지 콘텐츠 (Suspense 내부)
 */
export default function ProfileContent() {
  const { data: user } = useCurrentUserProfileSuspense();
  const [activeTab, setActiveTab] = useState<ProfileTab>('activity');
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const prevTab = useRef(activeTab);

  useEffect(() => {
    if (prevTab.current !== activeTab) {
      setDirection(activeTab === 'info' ? 'right' : 'left');
      prevTab.current = activeTab;
    }
  }, [activeTab]);

  const privateTabs = (() => {
    const tabs: ProfileTab[] = [];
    if (user && user.showActivityPublic === false) tabs.push('activity');
    if (user && user.showInfoPublic === false) tabs.push('info');
    return tabs;
  })();

  const isCurrentTabPrivate = privateTabs.includes(activeTab);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>프로필 정보를 불러올 수 없어요.</p>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="space-y-4 px-2">
          <ProfileCompactHeader user={user} />
          <ProfileActionRow userId={user.id} />
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
            {isCurrentTabPrivate && (
              <div className="flex items-center gap-1.5 px-4 py-2 mx-1 rounded-lg bg-surface-hover text-xs text-muted-foreground">
                <LockSimpleIcon size={12} weight="bold" className="flex-shrink-0" />
                <span>다른 사용자에게 공개되지 않는 탭이에요</span>
              </div>
            )}

            <QueryErrorBoundary>
              <Suspense fallback={<PulseLoader />}>
                {activeTab === 'activity' && <ProfileActivityGrid userId={user.id} />}
                {activeTab === 'info' && <ProfileInfoTab user={user} isOwnProfile />}
              </Suspense>
            </QueryErrorBoundary>
          </div>
        </div>
      </div>

      {/* transform 영향 밖에 배치해야 fixed 위치가 뷰포트 기준으로 적용됨 */}
      {activeTab === 'activity' && (
        <AppLink
          href="/community/write"
          className="fixed bottom-(--fab-bottom) right-4 z-20 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
        >
          <PencilSimpleIcon size={24} weight="bold" className="text-primary-foreground" />
        </AppLink>
      )}
    </>
  );
}
