'use client';

import { PencilSimpleLineIcon, FunnelIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { MainTabHeader } from '@/components/layouts';

interface CommunityHeaderProps {
  onNewPost?: () => void;
  onFilter?: () => void;
}

/**
 * 커뮤니티 페이지 헤더
 */
export default function CommunityHeader({ onNewPost, onFilter }: CommunityHeaderProps) {
  return (
    <MainTabHeader
      title="커뮤니티"
      action={
        <>
          <Button variant="outline" size="xs" onClick={onFilter}>
            <FunnelIcon size={16} />
          </Button>
          <Button variant="primary" size="xs" onClick={onNewPost}>
            <PencilSimpleLineIcon size={16} />
            글쓰기
          </Button>
        </>
      }
    />
  );
}
