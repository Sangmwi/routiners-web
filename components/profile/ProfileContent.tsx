'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { PencilSimpleIcon, LockSimpleIcon } from '@phosphor-icons/react';
import { useCurrentUserProfileSuspense } from '@/hooks/profile';
import type { ProfileTab } from '@/components/profile/ProfileTabBar';
import ProfileCompactHeader from '@/components/profile/ProfileCompactHeader';
import ProfileActionRow from '@/components/profile/ProfileActionRow';
import ProfileTabBar from '@/components/profile/ProfileTabBar';
import ProfileActivityGrid from '@/components/profile/ProfileActivityGrid';
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import AppLink from '@/components/common/AppLink';

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

  const privateTabs = useMemo(() => {
    const tabs: ProfileTab[] = [];
    if (user && user.showActivityPublic === false) tabs.push('activity');
    if (user && user.showInfoPublic === false) tabs.push('info');
    return tabs;
  }, [user]);

  const isCurrentTabPrivate = privateTabs.includes(activeTab);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>프로필 정보를 불러올 수 없어요.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4 px-2">
        <ProfileCompactHeader user={user} />
        <ProfileActionRow userId={user.id} />
      </div>

      <ProfileTabBar activeTab={activeTab} onTabChange={setActiveTab} privateTabs={privateTabs} />

      <div className="overflow-hidden">
        <div
          key={activeTab}
          className="animate-tab-slide"
          style={{
            '--slide-from': direction === 'right' ? '30px' : '-30px',
          } as React.CSSProperties}
        >
          {isCurrentTabPrivate && (
            <div className="flex items-center gap-1.5 px-4 py-2 mx-1 mt-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
              <LockSimpleIcon size={12} weight="bold" className="flex-shrink-0" />
              <span>다른 사용자에게 공개되지 않는 탭이에요</span>
            </div>
          )}

          {activeTab === 'activity' && (
            <>
              <ProfileActivityGrid userId={user.id} />
              <AppLink
                href="/community/write"
                className="fixed bottom-24 right-4 z-20 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
              >
                <PencilSimpleIcon size={24} weight="bold" className="text-primary-foreground" />
              </AppLink>
            </>
          )}

          {activeTab === 'info' && <ProfileInfoTab user={user} />}
        </div>
      </div>
    </div>
  );
}
