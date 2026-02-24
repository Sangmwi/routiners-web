'use client';

import { LockSimpleIcon } from '@phosphor-icons/react';
import UnderlineTabs from '@/components/ui/UnderlineTabs';

const BASE_TABS = [
  { value: 'activity', label: '활동' },
  { value: 'info', label: '정보' },
] as const;

export type ProfileTab = (typeof BASE_TABS)[number]['value'];

interface ProfileTabBarProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  /** 비공개 상태인 탭 목록 */
  privateTabs?: ProfileTab[];
}

export default function ProfileTabBar({
  activeTab,
  onTabChange,
  privateTabs = [],
}: ProfileTabBarProps) {
  const tabs = BASE_TABS.map((tab) => ({
    ...tab,
    icon: privateTabs.includes(tab.value) ? (
      <LockSimpleIcon size={12} weight="bold" className="text-hint-strong" />
    ) : undefined,
  }));

  return (
    <UnderlineTabs
      tabs={tabs}
      value={activeTab}
      onChange={onTabChange}
      layout="equal"
      className="mt-6"
    />
  );
}
