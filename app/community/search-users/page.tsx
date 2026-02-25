'use client';

import { DetailLayout } from '@/components/layouts';
import EmptyState from '@/components/common/EmptyState';
import { EMPTY_STATE } from '@/lib/config/theme';

/**
 * 사용자 검색 페이지 (스텁)
 */
export default function SearchUsersPage() {
  return (
    <DetailLayout title="사용자 검색" centered>
      <EmptyState
        {...EMPTY_STATE.community.searchPending}
        size="lg"
      />
    </DetailLayout>
  );
}
