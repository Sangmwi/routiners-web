'use client';

import { ReactNode } from 'react';
import UnderlineTabs from '@/components/ui/UnderlineTabs';

export type PrimaryTab = 'recommended' | 'following';

const TABS = [
  { value: 'recommended', label: '추천' },
  { value: 'following', label: '팔로잉' },
] as const;

interface PrimaryTabsProps {
  activeTab: PrimaryTab;
  onTabChange: (tab: PrimaryTab) => void;
  /** 탭 오른쪽에 추가할 액션 버튼 (예: 검색, 글쓰기) */
  actions?: ReactNode;
}

/**
 * 커뮤니티 메인 탭 (추천/팔로잉)
 */
export default function PrimaryTabs({
  activeTab,
  onTabChange,
  actions,
}: PrimaryTabsProps) {
  return (
    <UnderlineTabs
      tabs={TABS}
      value={activeTab}
      onChange={onTabChange}
      layout="auto"
      rightSlot={
        actions ? (
          <div className="flex items-center gap-1">{actions}</div>
        ) : undefined
      }
    />
  );
}
