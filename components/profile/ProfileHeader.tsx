'use client';

import { GearSixIcon } from '@phosphor-icons/react';
import { MainTabHeader } from '@/components/layouts';
import AppLink from '@/components/common/AppLink';

/**
 * 프로필 페이지 전용 헤더
 * 메인 탭 레이아웃 내에서 사용되며, 설정 링크를 포함합니다.
 */
export default function ProfileHeader() {
  return (
    <MainTabHeader
      title="프로필"
      action={
        <AppLink
          href="/settings"
          className="p-1.5 hover:bg-surface-muted rounded-lg transition-colors"
        >
          <GearSixIcon size={20} className="text-muted-foreground" />
        </AppLink>
      }
    />
  );
}
