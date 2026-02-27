'use client';

import { PencilSimpleLineIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { MainTabHeader } from '@/components/layouts';

interface CommunityHeaderProps {
  onNewPost?: () => void;
}

/**
 * 커뮤니티 페이지 헤더
 */
export default function CommunityHeader({ onNewPost }: CommunityHeaderProps) {
  return (
    <MainTabHeader
      title="커뮤니티"
      action={
        <Button variant="primary" size="xs" onClick={onNewPost}>
          <PencilSimpleLineIcon size={16} />
          글쓰기
        </Button>
      }
    />
  );
}
