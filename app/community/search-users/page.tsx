'use client';

import { DetailLayout } from '@/components/layouts';
import EmptyState from '@/components/common/EmptyState';
import { UserFocusIcon } from '@phosphor-icons/react';

/**
 * 사용자 검색 페이지 (스텁)
 */
export default function SearchUsersPage() {
  return (
    <DetailLayout title="사용자 검색" centered>
      <EmptyState
        icon={UserFocusIcon}
        message="사용자 검색 기능 준비 중이에요"
        hint="곧 다른 회원을 찾고 팔로우할 수 있어요"
        size="lg"
        showIconBackground
      />
    </DetailLayout>
  );
}
