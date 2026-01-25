'use client';

import Link from 'next/link';
import { PencilSimpleIcon } from '@phosphor-icons/react';
import MainTabHeader from '@/components/common/MainTabHeader';

/**
 * 프로필 페이지 전용 헤더
 * 메인 탭 레이아웃 내에서 사용되며, 설정 링크를 포함합니다.
 */
export default function ProfileHeader() {
  return (
    <MainTabHeader
      title="내 프로필"
      action={
        <Link
          href="/profile/edit"
          prefetch={true}
          className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors"
          aria-label="프로필 편집"
        >
          <PencilSimpleIcon size={20} className="text-muted-foreground" />
        </Link>
      }
    />
  );
}
