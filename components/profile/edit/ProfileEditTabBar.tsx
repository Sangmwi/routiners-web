'use client';

import UnderlineTabs from '@/components/ui/UnderlineTabs';

const TABS = [
  { value: 'basic', label: '기본' },
  { value: 'details', label: '상세' },
  { value: 'military', label: '군 정보' },
] as const;

export type EditTab = (typeof TABS)[number]['value'];

interface ProfileEditTabBarProps {
  activeTab: EditTab;
  onTabChange: (tab: EditTab) => void;
}

/**
 * 프로필 편집 탭바
 */
export default function ProfileEditTabBar({ activeTab, onTabChange }: ProfileEditTabBarProps) {
  return (
    <UnderlineTabs
      tabs={TABS}
      value={activeTab}
      onChange={onTabChange}
      layout="equal"
    />
  );
}
